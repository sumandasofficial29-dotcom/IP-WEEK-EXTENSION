"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureTemplate = void 0;
class FeatureTemplate {
    build(ctx) {
        return `
You are a senior software engineer working in a real production repository.

${ctx.repoContext}

We are implementing a new feature.

TASK:
${ctx.userInput}

REQUIREMENTS:
- Follow existing repository architecture
- Respect dependency ecosystem
- Write production-ready code
- Follow clean code and SOLID principles
- Ensure accessibility and scalability
- Handle edge cases
- Ensure backward compatibility

OUTPUT FORMAT:
- Provide complete implementation
- Include file path if relevant
- Add inline documentation
- Avoid pseudo-code
- Avoid unnecessary explanation

Deliver the final implementation only.
`.trim();
    }
}
exports.FeatureTemplate = FeatureTemplate;
//# sourceMappingURL=feature.template.js.map