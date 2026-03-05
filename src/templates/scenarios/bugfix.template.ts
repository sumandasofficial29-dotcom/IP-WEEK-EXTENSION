export class BugfixTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior software engineer debugging a production system.

${repoContext}

BUG REPORT:
${task}

OBJECTIVE:
- Identify possible root causes
- Provide corrected implementation
- Ensure no regression
- Consider edge cases
- Preserve backward compatibility
- Suggest minimal changes

OUTPUT:
- Explain root cause briefly
- Provide fixed code
- Mention modified file paths
`.trim();
  }
}
