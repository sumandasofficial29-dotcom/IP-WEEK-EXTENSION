export class ExplanationTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior engineer explaining code and concepts.

${repoContext}

EXPLANATION REQUEST:
${task}

OBJECTIVE:
- Provide clear and accurate explanation
- Use analogies where helpful
- Break down complex concepts
- Include relevant code examples
- Target appropriate expertise level
- Highlight important nuances

OUTPUT:
- Provide comprehensive explanation
- Use bullet points for clarity
- Include code snippets where relevant
`.trim();
  }
}
