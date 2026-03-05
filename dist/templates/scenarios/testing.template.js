"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingTemplate = void 0;
class TestingTemplate {
    build(task, repoContext) {
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
exports.TestingTemplate = TestingTemplate;
//# sourceMappingURL=testing.template.js.map