---
title: ${title}
---

# ${title}

${ problem ? "## Problem\n\n" + problem : "" }

${ note ? "## Solution\n\n" + note : "" }

${
code ?

"## Code\n\n" +
code
.map(
({ type, solution }) =>
`### ${type.toUpperCase()}\n\n\`\`\`${type}\n${solution}\n\`\`\``
)
.join("\n\n") : ""
}
