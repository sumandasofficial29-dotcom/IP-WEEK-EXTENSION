export class RefactorTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior software architect improving code quality.

${repoContext}

REFACTOR REQUEST:
${task}

OBJECTIVE:
- Improve code structure and readability
- Follow SOLID principles
- Apply appropriate design patterns
- Maintain backward compatibility
- Preserve existing behavior
- Add documentation where needed

OUTPUT:
- Provide refactored implementation
- Explain key changes
- Mention modified file paths
`.trim();
  }
}
