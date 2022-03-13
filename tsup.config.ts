import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: ["src/index.ts", "src/leetcode-dump.ts"],
    outDir: "lib",
    target: "node14",
    format: ["cjs", "esm"],
    clean: true,
    // splitting: false,
    // minify: !options.watch,
    dts: options.watch ? false : { resolve: true },
}));
