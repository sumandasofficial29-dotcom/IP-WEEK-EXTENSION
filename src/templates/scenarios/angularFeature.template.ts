export class AngularFeatureTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior Angular architect working in an enterprise Angular application.

${repoContext}

FEATURE REQUEST:
${task}

IMPLEMENTATION STRATEGY:
- Use Angular best practices
- Use Dependency Injection
- Maintain module boundaries
- Use Angular services for state handling
- Respect Angular lifecycle hooks
- Ensure AOT compatibility
- Follow strict TypeScript rules
- Include unit test scaffolding if relevant

Deliver complete production-ready Angular implementation.
Include file paths.
`.trim();
  }
}
