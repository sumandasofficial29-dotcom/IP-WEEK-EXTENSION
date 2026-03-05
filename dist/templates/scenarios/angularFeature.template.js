"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularFeatureTemplate = void 0;
class AngularFeatureTemplate {
    build(task, repoContext) {
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
exports.AngularFeatureTemplate = AngularFeatureTemplate;
//# sourceMappingURL=angularFeature.template.js.map