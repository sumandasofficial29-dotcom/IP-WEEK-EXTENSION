"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreFiles = scoreFiles;
function scoreFiles(task, classes, activeFilePath) {
    const lowerTask = task.toLowerCase();
    const scores = [];
    for (const cls of classes) {
        let score = 0;
        const className = cls.name.toLowerCase();
        const filePath = cls.filePath;
        // Strong match
        if (lowerTask.includes(className))
            score += 15;
        // Active file gets massive boost
        if (activeFilePath && filePath === activeFilePath)
            score += 25;
        if (filePath.includes("service"))
            score += 3;
        if (filePath.includes("component"))
            score += 3;
        scores.push({ filePath, score });
    }
    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.filePath);
}
//# sourceMappingURL=fileRelevanceScorer.js.map