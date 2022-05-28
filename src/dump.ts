import fs from "node:fs";
import path from "node:path";
import { Credential, LeetCode, Submission, Whoami } from "leetcode-query";
import Ora from "ora";
import TurndownService from "turndown";
import { COMMENTS, EXTS, LEETCODE_SLUG_BASE } from "./constants";
import { T, readable_memory, retry as rerun } from "./utils";

const turndown = new TurndownService()
    .addRule("pre", {
        filter: "pre",
        replacement: (content, node: { textContent: string }) =>
            "\n```\n" + node.textContent.replace("```", "\\`\\`\\`").trim() + "\n```\n",
    })
    .addRule("sup", {
        filter: "sup",
        replacement: (content) => `^${content}`,
    });

export async function dump({
    session,
    output = path.resolve("leetcode"),
    clean = false,
    limit = "20/10",
    timezone = "Asia/Taipei",
    pure = false,
    retry = 3,
    verbose = true,
    template_path = path.resolve(__dirname, "../template/index.md"),
}: {
    session: string;
    output?: string;
    clean?: boolean;
    limit?: string;
    timezone?: string;
    pure?: boolean;
    retry?: number;
    verbose?: boolean;
    template_path?: string;
}): Promise<void> {
    process.env.TZ = timezone;

    const dir = path.resolve(output);

    if (fs.existsSync(dir) && clean) {
        fs.rmSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(template_path)) {
        throw new Error(`Template file not found: ${template_path}`);
    }
    const template = fs.readFileSync(template_path, "utf8");

    const cache_path = path.resolve(dir, ".cache.json");
    const cache: (Submission & { cached?: boolean })[] = fs.existsSync(cache_path)
        ? JSON.parse(fs.readFileSync(cache_path, "utf8"))
        : [];
    cache.sort((a, b) => b.id - a.id);
    for (let i = 0; i < cache.length; i++) {
        cache[i].cached = true;
    }

    const config_path = path.resolve(dir, ".config.json");
    const config: { skip: number[] } = fs.existsSync(config_path)
        ? JSON.parse(fs.readFileSync(config_path, "utf8"))
        : { skip: [] };

    const spinner = verbose ? Ora({ text: "Scanning...", spinner: "bouncingBar" }).start() : null;

    const credential = new Credential();
    await credential.init(session);
    const leetcode = new LeetCode(credential);
    leetcode.limiter.limit = +limit.split("/")[0];
    leetcode.limiter.interval = +limit.split("/")[1] * 1000;

    const user = await leetcode.whoami();

    if (user.isSignedIn === false) {
        spinner?.fail("No user found! Is your session expired?");
        process.exit(1);
    }

    if (cache.length > 0) {
        spinner?.info(`Cache Found. Skip scanning submissions before ID ${cache[0].id}`).start();
    }
    if (config.skip.length > 0) {
        spinner?.info(`Config Found. Will skip ${config.skip.length} submissions`).start();
    }
    const bests = await get_bests({ leetcode, spinner, retry, cache, skip: config.skip });

    spinner?.succeed(`Scan Done. (${bests.size} Accepted Problems)`);

    const table: [string, string, string, string[]][] = [];
    const entries = bests.entries();
    for (let i = 0; i < bests.size; i++) {
        const [slug, submissions] = entries.next().value as [
            string,
            Map<string, Submission & { cached?: boolean }>,
        ];
        spinner?.start(`Dumping Submissions... (${i + 1}/${bests.size})`);
        const problem = await leetcode.problem(slug); // intentionally keep for notes
        spinner &&
            (spinner.text += ` ${problem.questionFrontendId}. ${problem.title} [${[
                ...submissions.keys(),
            ].join(", ")}]`);
        const folder = path.resolve(dir, `${problem.questionFrontendId}. ${problem.title}`);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        fs.writeFileSync(
            path.resolve(folder, "README.md"),
            `# ${problem.questionFrontendId}. ${problem.title}\n\nTags: ${problem.topicTags
                .map((t) => "`" + t.name + "`")
                .join(", ")}\n\n${turndown.turndown(problem.content)}`,
        );

        fs.writeFileSync(path.resolve(folder, "NOTE.md"), problem.note || "");

        const row: [string, string, string, string[]] = [
            `[${problem.questionFrontendId}. ${problem.title}](./${encodeURI(
                path.basename(folder),
            )}) [🔗](${LEETCODE_SLUG_BASE}${slug}/)`,
            problem.difficulty,
            problem.topicTags.map((t) => "`" + t.name + "`").join(", "),
            [],
        ];

        for (const [lang, meta] of submissions) {
            const ext = EXTS[lang as keyof typeof EXTS];
            const file = path.resolve(folder, `${slug}${ext}`);
            if (!meta.cached) {
                const submission = await rerun(() => leetcode.submission(meta.id), retry);

                const info = `${COMMENTS[lang as keyof typeof COMMENTS]} ${
                    problem.questionFrontendId
                }. ${problem.title} (${new Date(+meta.timestamp * 1e3).toLocaleDateString()})\n${
                    COMMENTS[lang as keyof typeof COMMENTS]
                } Runtime: ${submission.runtime} ms (${submission.runtime_percentile.toFixed(
                    2,
                )}%) Memory: ${readable_memory(
                    submission.memory,
                )} (${submission.memory_percentile.toFixed(2)}%) \n\n`;

                fs.writeFileSync(file, `${pure ? "" : info}${submission.code}`);
            }
            row[3].push(`[${lang}](${encodeURI(`./${path.basename(folder)}/${slug}${ext}`)})`);
        }
        row[3].sort();
        table.push(row);

        spinner?.succeed(
            `Dumped ${problem.questionFrontendId}. ${problem.title} [${[...submissions.keys()].join(
                ", ",
            )}]`,
        );
    }
    spinner?.succeed("All Submissions Dumped.");

    fs.writeFileSync(path.resolve(dir, "README.md"), await create_toc(table, user, template));

    fs.writeFileSync(
        cache_path,
        JSON.stringify(
            [...bests.values()]
                .reduce((acc, subs) => [...acc, ...subs.values()], [] as Submission[])
                .sort((a, b) => b.id - a.id),
        ),
    );
}

async function create_toc(
    table: [string, string, string, string[]][],
    user: Whoami,
    template: string,
) {
    const card = `[![LeetCode Stats Card](https://leetcard.jacoblin.cool/${user.username})](https://leetcode.com/${user.username}/)`;
    const regex = /\d+\./;
    const table_str = table
        .sort(
            (a, b) =>
                parseInt(a[0].match(regex)?.[0] || "0") - parseInt(b[0].match(regex)?.[0] || "0"),
        )
        .map(
            ([title, difficulty, tags, solutions]) =>
                `| ${title} | ${difficulty} | ${tags} | ${solutions.join(" \\| ")} |`,
        )
        .join("\n");

    return T(template, { card, username: user.username, table: table_str });
}

async function get_bests({
    leetcode,
    spinner,
    retry,
    cache,
    skip,
}: {
    leetcode: LeetCode;
    spinner: Ora.Ora | null;
    retry: number;
    cache: (Submission & { cached?: boolean })[];
    skip: number[];
}) {
    const bests = new Map<string, Map<string, Submission & { cached?: boolean }>>();
    const set = new Set<number>();
    const skips = new Set(skip);

    for (const submission of cache) {
        if (!bests.has(submission.titleSlug)) {
            bests.set(submission.titleSlug, new Map<string, Submission & { cached?: boolean }>());
        }

        if (!skips.has(submission.id)) {
            bests.get(submission.titleSlug)?.set(submission.lang, submission);
            set.add(submission.id);
        }
    }

    const prev_last = cache[0]?.id || 0;
    for (let i = 0; i < 1000; i++) {
        const submissions = await rerun(
            () => leetcode.submissions({ limit: 20, offset: i * 20 }),
            retry,
        );

        if (submissions.every((submission) => set.has(submission.id))) {
            break;
        }

        for (const submission of submissions) {
            if (!set.has(submission.id) && !skips.has(submission.id) && submission.id > prev_last) {
                set.add(submission.id);

                if (submission.statusDisplay === "Accepted") {
                    if (bests.has(submission.titleSlug) === false) {
                        bests.set(
                            submission.titleSlug,
                            new Map<string, Submission & { cached?: boolean }>(),
                        );
                    }

                    const best = bests.get(submission.titleSlug) as Map<
                        string,
                        Submission & { cached?: boolean }
                    >;
                    const prev = best.get(submission.lang);

                    if (
                        prev === undefined ||
                        submission.runtime < prev.runtime ||
                        (submission.runtime === prev.runtime &&
                            submission.timestamp > prev.timestamp)
                    ) {
                        best.set(submission.lang, submission);
                    }
                }
            }
        }

        if (spinner) {
            spinner.text = `Scanning... ${set.size} submissions fetched`;
        }

        if (submissions.length < 20 || submissions[submissions.length - 1].id <= prev_last) {
            break;
        }
    }

    return bests;
}
