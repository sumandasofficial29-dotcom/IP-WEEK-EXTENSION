import { IntentResult, IntentCategory } from "../core/types";
export declare class IntentScorer {
    private readonly highComplexityKeywords;
    private readonly mediumComplexityKeywords;
    score(category: IntentCategory, input: string): IntentResult;
    private determineComplexity;
}
