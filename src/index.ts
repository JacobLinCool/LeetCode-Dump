#!/usr/bin/env node
import path from "node:path";
import chalk from "chalk";
import { program } from "commander";
import { config } from "dotenv";
import { build } from "./build";
import { dump } from "./dump";
import { get_package_meta } from "./utils";

config();
const package_meta = get_package_meta();
program.version(chalk`{cyanBright ${package_meta.name}} {yellowBright v${package_meta.version}}`);

process.stdout.isTTY = true;

program
    .option(
        "-s, --session <session>",
        "Your LeetCode Session",
        process.env.LEETCODE_SESSION || "process.env.LEETCODE_SESSION",
    )
    .option("-o, --output <path>", "Output Dir", path.resolve("leetcode"))
    .option("-c, --clean", "Clean Output Dir Before Start", true)
    .option("-cd, --cooldown <ms>", "Cooldown Between Actions, in ms", "250")
    .option("-t, --timezone <timezone>", "Your Timezone", "Asia/Taipei")
    .option("-p, --pure", "Pure Mode, No Additional Informations to Add", false)
    .option("-r, --retry <times>", "Times to Retry When Fail", "3")
    .action(async () => {
        const opts = program.opts();
        await dump({
            session: opts.session,
            output: opts.output,
            clean: opts.clean,
            cooldown: +opts.cooldown,
            timezone: opts.timezone,
            pure: opts.pure,
            retry: +opts.retry,
        });
    });

const build_command = program
    .command("build")
    .description("Build static site from dumped solutions")
    .option("-s, --source <path>", "Source Dir", path.resolve("leetcode"))
    .option("-o, --output <path>", "Output Dir", path.resolve("site"))
    .option("-t, --temp <path>", "Temp Dir", path.resolve("site_tmp"))
    .option("-c, --config <path>", "Vuepress Config Path", undefined)
    .action(() => {
        const opts = build_command.opts();
        build(opts.source, opts.output, opts.temp, opts.config);
    });

program.parse();
