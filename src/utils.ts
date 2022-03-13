import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { EXTS } from "./constants";

export function get_package_meta(): {
    version: string;
    name: string;
    description: string;
    [key: string]: unknown;
} {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
}

export function readable_memory(mem: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unit = 0;
    while (mem > 1e3) {
        mem /= 1e3;
        unit++;
    }
    return `${mem.toFixed(2)} ${units[unit]}`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
    func: () => T | Promise<T>,
    max_retry = 3,
    cooldown = 5_000,
): Promise<T> {
    let error: Error | null = null;
    for (let retry = 0; retry < max_retry; retry++) {
        try {
            return await func();
        } catch (err) {
            console.error(chalk.redBright(err));
            error = err as Error;
            await sleep(cooldown);
        }
    }
    throw error;
}

export async function cooldown<T>(func: () => T | Promise<T>, cd = 500): Promise<T> {
    const start = Date.now();
    const result = await func();
    const end = Date.now();
    await sleep(cd - (end - start));
    return result;
}

export function sort_object<T>(obj: { [key: string]: T }): { [key: string]: T } {
    const keys = Object.keys(obj).sort();
    const sorted: { [key: string]: T } = {};
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}

export function lang_to_ext(lang: string): string {
    lang = lang.toLowerCase();
    return EXTS[lang as keyof typeof EXTS] || `.${lang}`;
}

export function ext_to_lang(ext: string): string {
    ext = ext.replace(/^[^.]/, ".$&").toLowerCase();
    for (const lang in EXTS) {
        if (EXTS[lang as keyof typeof EXTS] === ext) {
            return lang;
        }
    }
    return ext.replace(/^\./, "");
}

export class Logger {
    constructor(public name = "", public verbose = 3) {
        if (verbose) {
            this.log(`Verbose Mode: ${verbose}`);
        }
    }

    log(...args: unknown[]): void {
        if (this.verbose >= 3) {
            console.log(chalk.gray(`[${this.name}]`), ...args);
        }
    }

    warn(...args: unknown[]): void {
        if (this.verbose >= 2) {
            console.warn(chalk.yellowBright(`[${this.name}]`), ...args);
        }
    }

    error(...args: unknown[]): void {
        if (this.verbose >= 1) {
            console.error(chalk.redBright(`[${this.name}]`), ...args);
        }
    }
}
