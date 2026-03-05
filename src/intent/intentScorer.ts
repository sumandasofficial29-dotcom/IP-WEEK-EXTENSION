import { IntentResult, ComplexityLevel, IntentCategory } from "../core/types";

export class IntentScorer {
  private readonly highComplexityKeywords = [
    "architecture",
    "refactor entire",
    "redesign",
    "migrate",
    "scalable",
    "microservices",
    "system design"
  ];

  private readonly mediumComplexityKeywords = [
    "refactor",
    "optimize",
    "integrate",
    "implement",
    "authentication",
    "database"
  ];

  score(category: IntentCategory, input: string): IntentResult {
    if (category === IntentCategory.UNKNOWN) {
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
      intent: category as unknown as IntentResult["intent"],
      confidence,
      complexity
    };
  }

  private determineComplexity(input: string): ComplexityLevel {
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
