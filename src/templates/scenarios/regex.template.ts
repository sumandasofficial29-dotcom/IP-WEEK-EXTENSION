export class RegexTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a regex expert crafting precise patterns.

${repoContext}

REGEX REQUEST:
${task}

OBJECTIVE:
- Create accurate regex pattern
- Handle edge cases
- Consider performance
- Make pattern readable with comments
- Test against examples
- Document pattern groups

OUTPUT:
- Provide regex pattern
- Include test cases
- Explain pattern components
- Provide usage example in code
`.trim();
  }
}
