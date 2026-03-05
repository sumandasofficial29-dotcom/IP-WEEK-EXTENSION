"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoClassifier = void 0;
class RepoClassifier {
    classify(files) {
        const paths = files.map(f => f.path);
        const hasControllers = paths.some(p => p.includes("controllers"));
        const hasServices = paths.some(p => p.includes("services"));
        const hasComponents = paths.some(p => p.includes("components"));
        if (hasControllers && hasServices)
            return "layered";
        if (hasComponents)
            return "component-based";
        if (files.length > 800)
            return "monolith";
        return "unknown";
    }
}
exports.RepoClassifier = RepoClassifier;
//# sourceMappingURL=repoClassifier.js.map