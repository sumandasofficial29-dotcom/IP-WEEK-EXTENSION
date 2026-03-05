export class DocumentationTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a technical writer creating clear documentation.

${repoContext}

DOCUMENTATION REQUEST:
${task}

OBJECTIVE:
- Write clear and concise documentation
- Use proper markdown formatting
- Include code examples where helpful
- Cover edge cases and caveats
- Target appropriate audience level
- Ensure accuracy

OUTPUT:
- Provide complete documentation
- Include usage examples
- Add any relevant warnings or notes
`.trim();
  }
}
