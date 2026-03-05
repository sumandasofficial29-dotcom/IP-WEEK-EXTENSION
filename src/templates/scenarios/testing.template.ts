export class TestingTemplate {
  build(task: string, repoContext: string): string {
    return `
You are a senior QA-aware engineer writing production-grade tests.

${repoContext}

TEST REQUIREMENT:
${task}

INSTRUCTIONS:
- Use detected testing framework
- Cover edge cases
- Mock external dependencies
- Ensure high coverage
- Follow AAA pattern

Deliver complete test file.
`.trim();
  }
}
