"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectContextMode = detectContextMode;
function detectContextMode(task) {
    const lower = task.toLowerCase();
    if (lower.includes("understand") || lower.includes("explain"))
        return "explanation";
    if (lower.includes("fix") || lower.includes("bug"))
        return "bugfix";
    if (lower.includes("test"))
        return "testing";
    if (lower.includes("refactor"))
        return "refactor";
    return "feature";
}
//# sourceMappingURL=contextMode.js.map