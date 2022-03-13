# LeetCode Dump

<p align="center">
  Dump your LeetCode solutions, and generate a static website to show them.
</p>

<p align="center">
  <a href="#install">Install</a> |
  <a href="#usage">Usage</a> |
  <a href="#github-action">GitHub Action</a>
</p>

## Install

You need Node.js 16+.

```sh
npm i -g leetcode-dump
```

## Usage

### Dump Solutions

```sh
❯ leetcode-dump --help
Usage: leetcode-dump [options] [command]

Options:
  -V, --version              output the version number
  -s, --session <session>    Your LeetCode Session (default: "process.env.LEETCODE_SESSION")
  -o, --output <path>        Output Dir (default: "./leetcode")
  -c, --clean                Clean Output Dir Before Start (default: true)
  -cd, --cooldown <ms>       Cooldown Between Actions, in ms (default: "200")
  -t, --timezone <timezone>  Your Timezone (default: "Asia/Taipei")
  -p, --pure                 Pure Mode, No Additional Informations to Add (default: false)
  -r, --retry <times>        Times to Retry When Fail (default: "3")
  -v, --verbose [bool]       Verbose Mode (default: true)
  -h, --help                 display help for command
```

Example:

```sh
leetcode-dump -s "eyJ0eXAiOiJKV1...AJFGlVhZ7f5QL8"
```

### Build Static Site

This will use Vuepress to build a static site from solutions dumped by `leetcode-dump`.

```sh
❯ leetcode-dump build --help
Usage: leetcode-dump build [options]

Build static site from dumped solutions

Options:
  -s, --source <path>   Source Dir (default: "./leetcode")
  -o, --output <path>   Output Dir (default: "./site")
  -c, --config <path>   Vuepress Config Path
  -v, --verbose [bool]  Verbose Mode (default: true)
  -h, --help            display help for command
```

Example:

```sh
leetcode-dump build
```

### Generate Vuepress Content Source

This will generate a Vuepress content source from solutions dumped by `leetcode-dump`.

It is similar to `leetcode-dump build`, but you can do more things to customize the content source, then use Vuepress to build static site by yourself.

```sh
❯ leetcode-dump transform --help
Usage: leetcode-dump transform [options]

Transform dumped solutions to a Vuepress source

Options:
  -s, --source <path>   Source Dir (default: "./leetcode")
  -o, --output <path>   Output Dir (default: "./site-source")
  -v, --verbose [bool]  Verbose Mode (default: true)
  -h, --help            display help for command
```

Example:

```sh
leetcode-dump transform
```

### Note

If you install `leetcode-dump` globally, you can use `lcd`, the alias of `leetcode-dump`, as a command line tool.

## GitHub Action

[There is a Template, you can simply use it and setup in a minute.](https://github.com/JacobLinCool/LeetCode-Solutions-Template)

[Example Repository](https://github.com/JacobLinCool/LeetCode-Solutions)
