import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createBuildApp } from "vuepress";
import { DOC_TEMPLATE } from "./constants";

export async function build(
    source: string,
    output: string,
    tmp: string,
    config?: string,
): Promise<void> {
    source = path.resolve(source);
    output = path.resolve(output);
    tmp = path.resolve(tmp);
    console.log(`Building site to ${output}`);

    if (!fs.existsSync(source)) {
        throw new Error(`${source} does not exist`);
    }

    if (fs.existsSync(tmp)) {
        fs.rmSync(tmp, { recursive: true });
    }
    fs.mkdirSync(tmp, { recursive: true });

    fs.writeFileSync(
        path.resolve(tmp, "README.md"),
        fix(fs.readFileSync(path.resolve(source, "README.md"), "utf8")),
    );

    const problems = fs
        .readdirSync(source)
        .filter((name) => fs.statSync(path.resolve(source, name)).isDirectory());

    for (const problem of problems) {
        const slug = problem
            .replace(/(\d+)\./, "$1")
            .replace(/\s+/g, "-")
            .replace("'", "")
            .toLowerCase();
        fs.mkdirSync(path.resolve(tmp, slug), { recursive: true });
        const doc = gen_doc(path.resolve(source, problem));
        fs.writeFileSync(path.resolve(tmp, slug, "index.md"), doc);
    }

    fs.rmSync(output, { recursive: true });
    await build_site(tmp, output, config);
    fs.rmSync(tmp, { recursive: true });
}

function gen_doc(src: string): string {
    const title = path.basename(src);

    const problem = fs.readFileSync(path.resolve(src, "README.md"), "utf8");
    const note = fs.readFileSync(path.resolve(src, "NOTE.md"), "utf8");

    const sources = fs.readdirSync(src).filter((name) => !name.endsWith(".md"));

    const solutions = sources.map((name) => {
        const solution = fs.readFileSync(path.resolve(src, name), "utf8");
        return { type: path.extname(name).slice(1), solution };
    });

    return DOC_TEMPLATE.replace(/\$title/g, title)
        .replace(/\$note/g, note)
        .replace(/\$problem/g, problem.replace(/#[^\n]+\n/, "<br>\n\n"))
        .replace(
            /\$code/g,
            solutions
                .map(
                    ({ type, solution }) =>
                        `### ${type.toUpperCase()}\n\n\`\`\`${type}\n${solution}\n\`\`\``,
                )
                .join("\n\n"),
        );
}

function fix(source: string) {
    return source
        .replace(/\(\.\/\d{1,4}\.[^)]+\)/g, (match) =>
            match
                .replace(/(\d+)\./, "$1")
                .replace(/(%20)+/g, "-")
                .replace("'", "")
                .toLowerCase(),
        )
        .replace(/([^.]\/)[^.]+\.([\w]+\))/g, "$1#$2");
}

async function build_site(source: string, dest: string, config?: string) {
    if (config) {
        execSync(`vuepress build ${source} --dest ${dest} --config ${config}`, {
            stdio: "inherit",
        });
    } else {
        const app = createBuildApp({
            source,
            dest,
            plugins: [["@vuepress/plugin-search"]],
            themeConfig: { home: "/" },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            title: "LeetCode Solutions",
        });

        await app.init();
        await app.prepare();

        await app.build();
        await app.pluginApi.hooks.onGenerated.process(app);
    }
}
