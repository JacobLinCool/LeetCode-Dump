import fs from "node:fs";
import path from "node:path";
import { DOC_TEMPLATE } from "./constants";
import { Logger } from "./utils";

export async function transform(source: string, output: string, verbose = false): Promise<void> {
    const logger = new Logger("Transform", verbose ? 3 : 0);
    source = path.resolve(source);
    output = path.resolve(output);
    logger.log(`Source: ${source}`);
    logger.log(`Output: ${output}`);

    if (!fs.existsSync(source)) {
        throw new Error(`[Transform] ${source} does not exist`);
    }
    if (fs.existsSync(output)) {
        throw new Error(`[Transform] ${output} already exists`);
    }

    try {
        fs.mkdirSync(output, { recursive: true });

        fs.writeFileSync(
            path.resolve(output, "README.md"),
            fix(fs.readFileSync(path.resolve(source, "README.md"), "utf8")),
        );
        logger.log("Root level README.md written");

        const problems = fs
            .readdirSync(source)
            .filter((name) => fs.statSync(path.resolve(source, name)).isDirectory());
        logger.log(`${problems.length} problems found`);

        for (const problem of problems) {
            const slug = problem
                .replace(/(\d+)\./, "$1")
                .replace(/\s+/g, "-")
                .replace("'", "")
                .toLowerCase();
            fs.mkdirSync(path.resolve(output, slug), { recursive: true });
            const doc = gen_doc(path.resolve(source, problem));
            fs.writeFileSync(path.resolve(output, slug, "index.md"), doc);
            logger.log(`${problem} written`);
        }

        logger.log("Transform Complete");
    } catch (err) {
        logger.error(err);
    }
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
