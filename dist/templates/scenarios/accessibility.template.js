"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityTemplate = void 0;
class AccessibilityTemplate {
    build(task, repoContext) {
        return `
You are an accessibility expert ensuring inclusive design.

${repoContext}

ACCESSIBILITY REQUEST:
${task}

OBJECTIVE:
- Follow WCAG 2.1 guidelines
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Support screen readers
- Consider color contrast
- Test with assistive technologies

OUTPUT:
- Provide accessible implementation
- Include ARIA labels
- Mention keyboard shortcuts
- Include file paths
`.trim();
    }
}
exports.AccessibilityTemplate = AccessibilityTemplate;
//# sourceMappingURL=accessibility.template.js.map