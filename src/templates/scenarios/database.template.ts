export class DatabaseTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a database engineer designing schemas and queries.

${repoContext}

DATABASE REQUEST:
${task}

OBJECTIVE:
- Follow database normalization principles
- Optimize for query performance
- Use proper indexing strategies
- Handle transactions correctly
- Consider data integrity
- Document schema decisions

OUTPUT:
- Provide SQL or ORM implementation
- Include migration files if needed
- Explain design decisions
- Include file paths
`.trim();
  }
}
