"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorTemplate = void 0;
class RefactorTemplate {
    build(task, repoContext) {
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
exports.RefactorTemplate = RefactorTemplate;
//# sourceMappingURL=refactor.template.js.map