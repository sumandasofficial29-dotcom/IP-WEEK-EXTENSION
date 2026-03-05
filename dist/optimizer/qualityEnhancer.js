"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityEnhancer = void 0;
class QualityEnhancer {
    enhance(prompt, repo) {
        const enhancements = [];
        if (repo.language === "TypeScript") {
            enhancements.push("- Ensure strict typing and proper interfaces.");
        }
        if (repo.framework === "React" || repo.framework === "Next.js") {
            enhancements.push("- Follow React best practices and avoid unnecessary re-renders.");
        }
        if (repo.framework === "Next.js") {
            enhancements.push("- Consider SSR/SSG implications.");
        }
        if (repo.framework === "NestJS" || repo.framework === "Express") {
            enhancements.push("- Follow RESTful conventions and proper error handling.");
        }
        if (repo.testing) {
            enhancements.push(`- Write tests using ${repo.testing}.`);
        }
        if (repo.styling === "Tailwind") {
            enhancements.push("- Use Tailwind utility classes for styling.");
        }
        if (enhancements.length === 0) {
            return prompt;
        }
        return `${prompt}\n\n### Quality Guidelines\n${enhancements.join("\n")}`;
    }
}
exports.QualityEnhancer = QualityEnhancer;
//# sourceMappingURL=qualityEnhancer.js.map