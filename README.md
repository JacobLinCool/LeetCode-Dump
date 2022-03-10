# LeetCode-Dump

Dump Your LeetCode Solutions, and generate a static website to share your solutions.

## Install

You need Node.js 16+.

```sh
npm i -g leetcode-dump
```

## Usage

### Dump Solutions

```sh
Usage: leetcode-dump [options]

Options:
  -V, --version              output the version number
  -s, --session <session>    Your LeetCode Session (default:
                             "process.env.LEETCODE_SESSION")
  -o, --output <path>        Output Dir (default: "./leetcode/")
  -c, --clean                Clean Output Dir Before Start (default: true)
  -cd, --cooldown <ms>       Cooldown Between Actions, in ms (default: "250")
  -t, --timezone <timezone>  Your Timezone (default: "Asia/Taipei")
  -p, --pure                 Pure Mode, No Additional Informations to Add
                             (default: false)
  -r, --retry <times>        Times to Retry When Fail (default: "3")
  -h, --help                 display help for command
```

Example:

```sh
leetcode-dump -s "eyJ0eXAiOiJKV1...AJFGlVhZ7f5QL8"
```

### Generate Site

This will transform the dumped solutions into a static site use Vuepress.

```sh
Usage: leetcode-dump build [options]

Build static site from dumped solutions

Options:
  -s, --source <path>  Source Dir (default: "./leetcode")
  -o, --output <path>  Output Dir (default: "./site")
  -t, --temp <path>    Temp Dir (default: "./site_tmp")
  -c, --config <path>  Vuepress Config Path
  -h, --help           display help for command
```

Example:

```sh
leetcode-dump build
```

## GitHub Action Usage

[Example Repository](https://github.com/JacobLinCool/LeetCode-Solutions)
