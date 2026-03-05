"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactFeatureTemplate = void 0;
class ReactFeatureTemplate {
    build(task, repoContext) {
        return `
You are a senior React engineer working in a production-grade React codebase.

${repoContext}

FEATURE REQUEST:
${task}

IMPLEMENTATION REQUIREMENTS:
- Use functional components
- Prefer hooks over class components
- Respect existing folder structure
- Ensure accessibility (ARIA)
- Use existing styling system
- Avoid prop drilling if context exists
- Add unit test example if test framework exists

Deliver complete implementation with file paths.
`.trim();
    }
}
exports.ReactFeatureTemplate = ReactFeatureTemplate;
//# sourceMappingURL=reactFeature.template.js.map