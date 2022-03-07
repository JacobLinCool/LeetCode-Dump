#!/usr/bin/env node
import path from "node:path";
import chalk from "chalk";
import { program } from "commander";
import { config } from "dotenv";
import { dump } from "./dump";
import { get_package_meta } from "./utils";

config();
const package_meta = get_package_meta();
program.version(chalk`{cyanBright ${package_meta.name}} {yellowBright v${package_meta.version}}`);

program
    .option(
        "-s, --session <session>",
        "Your LeetCode Session",
        process.env.LEETCODE_SESSION || "process.env.LEETCODE_SESSION",
    )
    .option("-o, --output <path>", "Output Dir", path.resolve("leetcode"))
    .option("-c, --clean", "Clean Output Dir Before Start", true)
    .option("-cd, --cooldown <ms>", "Cooldown Between Actions, in ms", "1000")
    .option("-t, --timezone <timezone>", "Your Timezone", "Asia/Taipei")
    .option("-p, --pure", "Pure Mode, No Additional Informations to Add", false)
    .option("-r, --retry <times>", "Times to Retry When Fail", "3")
    .action(async () => {
        const opts = program.opts();
        await dump(
            opts.session,
            opts.output,
            opts.clean,
            +opts.cooldown,
            opts.timezone,
            opts.pure,
            +opts.retry,
        );
    });

program.parse();
