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

    await build_site(workspace, output, {
        title: "LeetCode Solutions",
        plugins: [
            [require.resolve("@vuepress/plugin-search"), {}],
            [require.resolve("@vuepress/plugin-pwa"), { skipWaiting: true }],
        ],
        ...safe_parse(config),
    });
    fs.rmSync(workspace, { recursive: true });
    logger.log("Build Complete");
}

async function build_site(workspace: string, dest: string, config?: unknown): Promise<void> {
    const exe = path.resolve(require.resolve("vuepress"), "../../bin/vuepress.js");

    fs.mkdirSync(path.resolve(workspace, "source", ".vuepress"), { recursive: true });
    fs.writeFileSync(
        path.resolve(workspace, "source", ".vuepress", "config.ts"),
        `export default ${JSON.stringify(config, null, 4)};`,
    );

    execSync(`${exe} build source --dest ${dest}`, { stdio: "inherit", cwd: workspace });
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
