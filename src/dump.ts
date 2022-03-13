import fs from "node:fs";
import path from "node:path";
import { Credential, LeetCode } from "leetcode-query";
import fetch from "node-fetch";
import Ora from "ora";
import TurndownService from "turndown";
import {
    COMMENTS,
    EXTS,
    LEETCODE_BASE,
    LEETCODE_DETAIL_BASE,
    LEETCODE_SLUG_BASE,
    README_TEMPLATE,
} from "./constants";
import { readable_memory, retry, sleep } from "./utils";

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

let leetcode: LeetCode;
let max_retry = 3;

export async function dump({
    session,
    output = path.resolve("leetcode"),
    clean = true,
    cooldown = 200,
    timezone = "Asia/Taipei",
    pure = false,
    retry = 3,
    verbose = true,
}: {
    session: string;
    output?: string;
    clean?: boolean;
    cooldown?: number;
    timezone?: string;
    pure?: boolean;
    retry?: number;
    verbose?: boolean;
}): Promise<void> {
    const { dir } = await setup({ timezone, retry, output, clean, session });

    const spinner = verbose ? Ora({ text: "Scanning...", spinner: "bouncingBar" }).start() : null;
    const { list, ac } = await get_list();
    spinner?.succeed(`Scan Done. (${list.length} Problems, ${ac.length} Accepted)`);
    await sleep(cooldown);

    const table: [string, string, string, string[]][] = [];
    for (let i = 0; i < ac.length; i++) {
        spinner?.start(`Dumping Submissions... (${i + 1}/${ac.length})`);
        const { titleSlug: slug } = ac[i];
        const problem = await get_problem(slug);
        spinner && (spinner.text += ` ${problem.questionFrontendId}. ${problem.title}`);
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

        fs.writeFileSync(path.resolve(folder, "NOTE.md"), problem.note);

        const submissions = await get_submissions(slug);
        spinner && (spinner.text += ` [${Object.keys(submissions).join(", ")}]`);
        await sleep(cooldown);

        const row: [string, string, string, string[]] = [
            `[${problem.questionFrontendId}. ${problem.title}](./${encodeURI(
                path.basename(folder),
            )}) [🔗](${LEETCODE_SLUG_BASE}${slug}/)`,
            problem.difficulty,
            problem.topicTags.map((t) => "`" + t.name + "`").join(", "),
            [],
        ];

        for (const lang in submissions) {
            const ext = EXTS[lang as keyof typeof EXTS];
            const file = path.resolve(folder, `${slug}${ext}`);
            if (!fs.existsSync(file)) {
                const submission = await get_submission(submissions[lang].id);

                const info = `${COMMENTS[lang as keyof typeof COMMENTS]} ${
                    problem.questionFrontendId
                }. ${problem.title} (${new Date(
                    +submissions[lang].timestamp * 1e3,
                ).toLocaleDateString()})\n${COMMENTS[lang as keyof typeof COMMENTS]} Runtime: ${
                    submission.runtime
                } ms (${submission.runtime_percentile.toFixed(2)}%) Memory: ${readable_memory(
                    submission.memory,
                )} (${submission.memory_percentile.toFixed(2)}%) \n\n`;

                fs.writeFileSync(file, `${pure ? "" : info}${submission.code}`);
                row[3].push(`[${lang}](${encodeURI(`./${path.basename(folder)}/${slug}${ext}`)})`);
                await sleep(cooldown);
            }
        }
        row[3].sort();
        table.push(row);

        spinner?.succeed(
            `Dumped ${problem.questionFrontendId}. ${problem.title} [${Object.keys(
                submissions,
            ).join(", ")}]`,
        );
    }
    spinner?.succeed("Submissions Dumped.");

    fs.writeFileSync(path.resolve(dir, "README.md"), await create_toc(table));
}

async function setup({
    session,
    output,
    clean,
    timezone,
    retry,
}: {
    session: string;
    output: string;
    clean: boolean;
    timezone: string;
    retry: number;
}) {
    process.env.TZ = timezone;
    max_retry = retry;

    const dir = path.resolve(output);
    if (fs.existsSync(dir) && clean) {
        fs.rmSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const credential = new Credential();
    await credential.init(session);
    leetcode = new LeetCode(credential);

    return { dir };
}

async function get_list() {
    const ql = `query allQuestionsStatusesRaw { allQuestions: allQuestionsRaw { titleSlug questionFrontendId status } }`;
    const json = await retry(
        () =>
            leetcode.graphql({
                query: ql,
                operationName: "allQuestionsStatusesRaw",
                variables: {},
            }),
        max_retry,
    );
    const list = json.data.allQuestions as {
        titleSlug: string;
        questionFrontendId: string;
        status: string;
    }[];
    const ac = list
        .filter((item) => item.status === "ac")
        .sort((a, b) => +a.questionFrontendId - +b.questionFrontendId);
    return { list, ac };
}

async function get_problem(slug: string) {
    const ql = `
    query questionData($slug: String!) {
        question(titleSlug: $slug) {
            questionFrontendId title content difficulty similarQuestions categoryTitle stats topicTags { name slug } note
        }
    }`;
    const json = (
        await retry(
            () =>
                leetcode.graphql({ query: ql, operationName: "questionData", variables: { slug } }),
            max_retry,
        )
    ).data.question as {
        questionFrontendId: string;
        title: string;
        content: string;
        difficulty: string;
        similarQuestions: { difficulty: string; title: string; titleSlug: string }[];
        categoryTitle: string;
        topicTags: { name: string; slug: string }[];
        stats: {
            totalAccepted: string;
            totalSubmission: string;
            totalAcceptedRaw: string;
            totalSubmissionRaw: string;
            acRate: string;
        };
        note: string;
    };

    json.similarQuestions = JSON.parse(json.similarQuestions as unknown as string);
    json.stats = JSON.parse(json.stats as unknown as string);

    return json;
}

async function get_submissions(slug: string) {
    const ql = `
    query Submissions($offset: Int!, $limit: Int!, $last: String, $slug: String!) {
        submissionList(offset: $offset, limit: $limit, lastKey: $last, questionSlug: $slug) {
            hasNext
            submissions { id statusDisplay lang runtime timestamp }
        }
    }`;
    const list: Record<string, { id: string; timestamp: string; runtime: string }> = {};
    for (let i = 0; i < 10; i++) {
        const json = await retry(
            () =>
                leetcode.graphql({
                    query: ql,
                    operationName: "Submissions",
                    variables: { slug, offset: 0 * 20, limit: 20 },
                }),
            max_retry,
        );
        const { submissions, hasNext } = json.data.submissionList;

        for (const submission of submissions) {
            const { id, statusDisplay, lang, runtime, timestamp } = submission;
            if (statusDisplay !== "Accepted") {
                continue;
            }
            if (
                !list[lang] ||
                parseInt(runtime) < parseInt(list[lang].runtime) ||
                (parseInt(runtime) === parseInt(list[lang].runtime) &&
                    parseInt(timestamp) > parseInt(list[lang].timestamp))
            ) {
                list[lang] = { id, timestamp, runtime };
            }
        }

        if (submissions.length === 0 || !hasNext) {
            break;
        }
    }

    return list;
}

async function get_submission(id: string) {
    return await retry(async () => {
        const res = await fetch(`${LEETCODE_DETAIL_BASE}${id}/`, {
            headers: {
                Cookie: `LEETCODE_SESSION=${leetcode.credential.session}`,
                Referer: LEETCODE_BASE,
            },
        });
        const raw = await res.text();
        const data = raw.match(/var pageData = ({[^]+?});/)?.[1];
        const json = new Function("return " + data)();
        const result = {
            runtime: +json.runtime,
            runtime_distribution: json.runtimeDistributionFormatted
                ? (JSON.parse(json.runtimeDistributionFormatted).distribution.map(
                      (item: [string, number]) => [+item[0], item[1]],
                  ) as [number, number][])
                : null,
            runtime_percentile: 0,
            memory: +json.memory,
            memory_distribution: json.memoryDistributionFormatted
                ? (JSON.parse(json.memoryDistributionFormatted).distribution.map(
                      (item: [string, number]) => [+item[0], item[1]],
                  ) as [number, number][])
                : null,
            memory_percentile: 0,
            code: json.submissionCode,
        };

        if (result.runtime_distribution) {
            result.runtime_percentile = result.runtime_distribution.reduce(
                (acc, [usage, p]) => acc + (usage >= result.runtime ? p : 0),
                0,
            );
        }
        if (result.memory_distribution) {
            result.memory_percentile = result.memory_distribution.reduce(
                (acc, [usage, p]) => acc + (usage >= result.memory / 1000 ? p : 0),
                0,
            );
        }

        return result;
    }, max_retry);
}

async function create_toc(table: [string, string, string, string[]][]) {
    const username = await get_username();
    const card = `[![LeetCode Stats Card](https://leetcode.card.workers.dev/?username=${username})](https://leetcode.com/${username}/)`;
    const table_str = table
        .map(
            ([title, difficulty, tags, solutions]) =>
                `| ${title} | ${difficulty} | ${tags} | ${solutions.join(" \\| ")} |`,
        )
        .join("\n");

    return README_TEMPLATE.replace("$card", card).replace("$table", table_str);
}

async function get_username() {
    return (
        await retry(
            () =>
                leetcode.graphql({
                    query: `query globalData { userStatus { username } }`,
                    operationName: "globalData",
                    variables: {},
                }),
            max_retry,
        )
    ).data.userStatus.username;
}
