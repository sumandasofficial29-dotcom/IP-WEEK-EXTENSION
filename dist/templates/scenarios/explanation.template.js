"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationTemplate = void 0;
class ExplanationTemplate {
    build(task, repoContext) {
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
exports.ExplanationTemplate = ExplanationTemplate;
//# sourceMappingURL=explanation.template.js.map