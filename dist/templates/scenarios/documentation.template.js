"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationTemplate = void 0;
class DocumentationTemplate {
    build(task, repoContext) {
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
exports.DocumentationTemplate = DocumentationTemplate;
//# sourceMappingURL=documentation.template.js.map