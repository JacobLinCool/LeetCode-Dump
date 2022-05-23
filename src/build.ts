import { execSync } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import { transform } from "./transform";
import { Logger } from "./utils";

export async function build(
    source: string,
    output: string,
    template_path: string,
    config?: string,
    verbose = false,
): Promise<void> {
    const logger = new Logger("Build", verbose ? 3 : 0);
    source = path.resolve(source);
    output = path.resolve(output);
    logger.log(`Building site to ${output}`);

    if (!fs.existsSync(source)) {
        throw new Error(`${source} does not exist`);
    }

    const workspace = fs.mkdtempSync("site-tmp-");
    const tmp = path.resolve(workspace, "source");
    fs.symlinkSync(
        path.resolve(__dirname, "../node_modules"),
        path.resolve(workspace, "node_modules"),
    );
    logger.log("Symlinked node_modules");

    transform(source, tmp, template_path, verbose);
    logger.log("Solutions Transformed");

    if (fs.existsSync(output)) {
        fs.rmSync(output, { recursive: true });
    }

    const { owner, repo } = github_repo();

    await build_site(workspace, output, {
        title: `${owner ? owner + "'s" : "LeetCode"} Solutions`,
        base: repo && !process.env.CNAME ? `/${repo}/` : "/",
        plugins: [
            [require.resolve("@vuepress/plugin-search"), {}],
            [require.resolve("@vuepress/plugin-pwa"), { skipWaiting: true }],
        ],
        ...safe_parse(config),
    });
    fs.rmSync(workspace, { recursive: true });
    logger.log("Build Complete");

    if (process.env.CNAME) {
        fs.writeFileSync(path.resolve(output, "CNAME"), process.env.CNAME);
        logger.log(`CNAME file created (${process.env.CNAME})`);
    }
}

async function build_site(workspace: string, dest: string, config?: unknown): Promise<void> {
    const exe = path.resolve(require.resolve("vuepress"), "../../bin/vuepress.js");

    fs.mkdirSync(path.resolve(workspace, "source", ".vuepress"), { recursive: true });
    fs.writeFileSync(
        path.resolve(workspace, "source", ".vuepress", "config.ts"),
        `export default ${JSON.stringify(config, null, 4)};`,
    );

    execSync(`${exe} build source --dest site-dest-temp`, { stdio: "inherit", cwd: workspace });
    fs.moveSync(path.resolve(workspace, "site-dest-temp"), dest, { overwrite: true });
}

function safe_parse(path?: string) {
    if (!path) {
        return undefined;
    }

    try {
        return JSON.parse(fs.readFileSync(path, "utf8"));
    } catch {
        return undefined;
    }
}

function github_repo(): { owner?: string; repo?: string } {
    const [owner, repo] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
    return { owner, repo };
}
