# LeetCode-Dump

Dump Your LeetCode Solutions.

```bash
Usage: leetcode-dump [options]

Options:
  -V, --version              output the version number
  -s, --session <session>    Your LeetCode Session (default: "process.env.LEETCODE_SESSION")
  -o, --output <path>        Output Dir (default: "./leetcode/")
  -c, --clean                Clean Output Dir Before Start (default: true)
  -cd, --cooldown <ms>       Cooldown Between Actions, in ms (default: "1000")
  -t, --timezone <timezone>  Your Timezone (default: "Asia/Taipei")
  -p, --pure                 Pure Mode, No Additional Informations to Add (default: false)
  -r, --retry <times>        Times to Retry When Fail (default: "3")
  -h, --help                 display help for command
```

Example:

```bash
leetcode-dump -s "eyJ0eXAiOiJKV1...AJFGlVhZ7f5QL8"
```

## GitHub Action Usage

[Example Repository](https://github.com/JacobLinCool/LeetCode-Solutions)
