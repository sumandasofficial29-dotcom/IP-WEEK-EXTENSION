export class MigrationTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior engineer handling code migrations and upgrades.

${repoContext}

MIGRATION REQUEST:
${task}

OBJECTIVE:
- Ensure zero data loss
- Maintain backward compatibility where possible
- Document breaking changes
- Provide rollback strategy
- Test migration steps
- Handle edge cases

OUTPUT:
- Provide migration implementation
- Include step-by-step instructions
- Mention any breaking changes
- Include file paths
`.trim();
  }
}
