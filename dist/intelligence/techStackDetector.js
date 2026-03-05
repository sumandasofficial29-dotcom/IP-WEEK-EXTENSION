"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechStackDetector = void 0;
const frameworkPatterns_1 = require("./frameworkPatterns");
class TechStackDetector {
    detect(deps) {
        const keys = Object.keys(deps);
        const detectMatch = (patterns) => patterns.some(p => keys.includes(p));
        const result = {};
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.angular))
            result.framework = "Angular";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.react))
            result.framework = "React";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.next))
            result.framework = "Next.js";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.vue))
            result.framework = "Vue";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.nest))
            result.framework = "NestJS";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.jest))
            result.testing = "Jest";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.karma))
            result.testing = "Karma";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.tailwind))
            result.styling = "TailwindCSS";
        if (detectMatch(frameworkPatterns_1.FrameworkPatterns.bootstrap))
            result.styling = "Bootstrap";
        return result;
    }
}
exports.TechStackDetector = TechStackDetector;
//# sourceMappingURL=techStackDetector.js.map