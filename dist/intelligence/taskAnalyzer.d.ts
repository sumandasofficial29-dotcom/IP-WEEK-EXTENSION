/**
 * Smart Task Analyzer
 *
 * Deeply understands user intent to generate precise, targeted prompts.
 * Extracts: action, target, constraints, expected outcome, and context clues.
 */
export interface AnalyzedTask {
    action: TaskAction;
    actionVerb: string;
    target: TaskTarget;
    constraints: string[];
    expectedOutcome?: string;
    mentionedFiles: string[];
    mentionedClasses: string[];
    mentionedMethods: string[];
    mentionedConcepts: string[];
    issueType?: IssueType;
    errorMessage?: string;
    currentBehavior?: string;
    expectedBehavior?: string;
    complexity: "simple" | "moderate" | "complex";
    estimatedScope: "single-file" | "multi-file" | "cross-module";
    originalInput: string;
    normalizedInput: string;
}
export type TaskAction = "create" | "modify" | "fix" | "refactor" | "delete" | "explain" | "test" | "document" | "optimize" | "migrate" | "debug" | "review";
export interface TaskTarget {
    type: "component" | "service" | "function" | "class" | "file" | "module" | "feature" | "api" | "test" | "unknown";
    name?: string;
    filePath?: string;
    description: string;
}
export type IssueType = "bug" | "error" | "performance" | "security" | "ux" | "logic" | "integration" | "data";
/**
 * Analyzes user input to extract structured task information
 */
export declare function analyzeTask(userInput: string, activeFilePath?: string): AnalyzedTask;
/**
 * Generates a structured task summary for the LLM
 */
export declare function formatTaskForLLM(task: AnalyzedTask): string;
