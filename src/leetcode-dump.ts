#!/usr/bin/env node
import path from "node:path";
import chalk from "chalk";
import { program } from "commander";
import { config } from "dotenv";
import { build } from "./build";
import { dump } from "./dump";
import { transform } from "./transform";
import { get_package_meta } from "./utils";

config();
const package_meta = get_package_meta();
program.version(chalk`{cyanBright ${package_meta.name}} {yellowBright v${package_meta.version}}`);

program
    .enablePositionalOptions()
    .option(
        "-s, --session <session>",
        "Your LeetCode Session",
        process.env.LEETCODE_SESSION || "process.env.LEETCODE_SESSION",
    )
    .option("-o, --output <path>", "Output Dir", path.resolve("leetcode"))
    .option("-c, --clean", "Clear Output Dir Before Start", false)
    .option("-l, --limit <rate>", "Rate Limit <req>/<sec>", "20/10")
    .option("-t, --timezone <timezone>", "Your Timezone", "Asia/Taipei")
    .option("-p, --pure", "Pure Mode, No Additional Informations to Add", false)
    .option("-r, --retry <times>", "Times to Retry When Fail", "3")
    .option("-v, --verbose [bool]", "Verbose Mode", true)
    .action(async () => {
        const opts = program.opts();
        await dump({
            session: opts.session,
            output: opts.output,
            clean: opts.clean,
            limit: opts.limit,
            timezone: opts.timezone,
            pure: opts.pure,
            retry: +opts.retry,
            verbose: opts.verbose,
        });
    });

const build_command = program
    .command("build")
    .description("Build static site from dumped solutions")
    .option("-s, --source <path>", "Source Dir", path.resolve("leetcode"))
    .option("-o, --output <path>", "Output Dir", path.resolve("site"))
    .option("-c, --config <path>", "Vuepress Config Path", undefined)
    .option("-v, --verbose [bool]", "Verbose Mode", true)
    .action(() => {
        const opts = build_command.opts();
        build(opts.source, opts.output, opts.config, opts.verbose);
    });

const transform_command = program
    .command("transform")
    .description("Transform dumped solutions to a Vuepress source")
    .option("-s, --source <path>", "Source Dir", path.resolve("leetcode"))
    .option("-o, --output <path>", "Output Dir", path.resolve("site-source"))
    .option("-v, --verbose [bool]", "Verbose Mode", true)
    .action(() => {
        const opts = transform_command.opts();
        transform(opts.source, opts.output, opts.verbose);
    });

program.parse();
