"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationTemplate = void 0;
class OptimizationTemplate {
    build(task, repoContext) {
        return `
You are a performance optimization specialist.

${repoContext}

OPTIMIZATION REQUEST:
${task}

OBJECTIVE:
- Profile before optimizing
- Focus on algorithmic complexity
- Reduce memory footprint
- Avoid premature optimization
- Maintain readability
- Document performance gains

OUTPUT:
- Provide optimized implementation
- Explain performance improvements
- Include file paths if relevant
`.trim();
    }
}
exports.OptimizationTemplate = OptimizationTemplate;
//# sourceMappingURL=optimization.template.js.map