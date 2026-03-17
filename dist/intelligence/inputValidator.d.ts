export interface InputQualityResult {
    score: number;
    issues: InputIssue[];
    suggestions: string[];
    enhancedTask?: string;
}
export interface InputIssue {
    type: "vague" | "missing-context" | "too-broad" | "ambiguous" | "missing-acceptance-criteria";
    message: string;
    severity: "warning" | "error";
}
/**
 * Analyzes input quality and provides improvement suggestions
 */
export declare function analyzeInputQuality(task: string): InputQualityResult;
