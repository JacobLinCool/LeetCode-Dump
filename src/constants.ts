export const EXTS: Record<string, string> = {
    cpp: ".cpp",
    java: ".java",
    python: ".py",
    python3: ".py",
    c: ".c",
    "c#": ".cs",
    javascript: ".js",
    ruby: ".rb",
    swift: ".swift",
    golang: ".go",
    scala: ".scala",
    kotlin: ".kt",
    rust: ".rs",
    php: ".php",
    typescript: ".ts",
    racket: ".rkt",
    erlang: ".erl",
    elixir: ".ex",
};

export const LEETCODE_BASE = "https://leetcode.com";
export const LEETCODE_DETAIL_BASE = LEETCODE_BASE + "/submissions/detail/";
export const LEETCODE_SLUG_BASE = LEETCODE_BASE + "/problems/";

export const README_TEMPLATE = `
# LeetCode Solutions

![LeetCode Stats Card]($card_url)

| Problem | Difficulty | Tags | Solution |
| ------- | ---------- | ---- | -------- |
$table
`;
