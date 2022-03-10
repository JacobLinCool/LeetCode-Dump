import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

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

export async function retry<T>(func: () => T | Promise<T>, max_retry = 3): Promise<T> {
    let error: Error | null = null;
    for (let retry = 0; retry < max_retry; retry++) {
        try {
            return await func();
        } catch (err) {
            console.error(chalk.redBright(err));
            error = err as Error;
        }
    }
    throw error;
}

export function sort_object<T>(obj: { [key: string]: T }): { [key: string]: T } {
    const keys = Object.keys(obj).sort();
    const sorted: { [key: string]: T } = {};
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}
