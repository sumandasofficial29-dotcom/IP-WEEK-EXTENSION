"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentScorer = void 0;
const types_1 = require("../core/types");
class IntentScorer {
    highComplexityKeywords = [
        "architecture",
        "refactor entire",
        "redesign",
        "migrate",
        "scalable",
        "microservices",
        "system design"
    ];
    mediumComplexityKeywords = [
        "refactor",
        "optimize",
        "integrate",
        "implement",
        "authentication",
        "database"
    ];
    score(category, input) {
        if (category === types_1.IntentCategory.UNKNOWN) {
            return {
                intent: "unknown",
                confidence: 0,
                complexity: "low"
            };
        }
        const lengthBoost = input.length > 50 ? 10 : 0;
        const confidence = Math.min(75 + lengthBoost, 100);
        const complexity = this.determineComplexity(input);
        return {
            intent: category,
            confidence,
            complexity
        };
    }
    determineComplexity(input) {
        const normalized = input.toLowerCase();
        const wordCount = input.trim().split(/\s+/).length;
        // Short requests = low complexity
        if (wordCount < 8) {
            return "low";
        }
        // Check for high complexity keywords
        for (const keyword of this.highComplexityKeywords) {
            if (normalized.includes(keyword)) {
                return "high";
            }
        }
        // Check for medium complexity keywords
        for (const keyword of this.mediumComplexityKeywords) {
            if (normalized.includes(keyword)) {
                return "medium";
            }
        }
        // Default based on length
        if (wordCount > 20) {
            return "medium";
        }
        return "low";
    }
}
exports.IntentScorer = IntentScorer;
//# sourceMappingURL=intentScorer.js.map