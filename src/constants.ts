export const LANGS = [
    "cpp",
    "java",
    "python",
    "python3",
    "c",
    "csharp",
    "javascript",
    "ruby",
    "swift",
    "golang",
    "scala",
    "kotlin",
    "rust",
    "php",
    "typescript",
    "racket",
    "erlang",
    "elixir",
] as const;

export const EXTS: {
    [key in typeof LANGS[number]]: string;
} = {
    cpp: ".cpp",
    java: ".java",
    python: ".py",
    python3: ".py3",
    c: ".c",
    csharp: ".cs",
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

export const COMMENTS: {
    [key in typeof LANGS[number]]: string;
} = {
    cpp: "//",
    java: "//",
    python: "#",
    python3: "#",
    c: "//",
    csharp: "//",
    javascript: "//",
    ruby: "#",
    swift: "//",
    golang: "//",
    scala: "//",
    kotlin: "//",
    rust: "//",
    php: "//",
    typescript: "//",
    racket: ";",
    erlang: "%",
    elixir: "#",
};

export const LEETCODE_BASE = "https://leetcode.com";
export const LEETCODE_DETAIL_BASE = LEETCODE_BASE + "/submissions/detail/";
export const LEETCODE_SLUG_BASE = LEETCODE_BASE + "/problems/";

export const README_TEMPLATE = `
# LeetCode Solutions

$card

## Solutions

| Problem | Difficulty | Tags | Solution |
| ------- | ---------- | ---- | -------- |
$table
`;

export const DOC_TEMPLATE = `---
title: $title
---

# $title

$problem

$note

## Code

$code
`;
