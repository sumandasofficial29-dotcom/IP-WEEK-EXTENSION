import { PromptQualityResult } from "../intelligence/promptQualityAnalyzer";
import { AnalyzedTask } from "../intelligence/taskAnalyzer";
export interface PromptResult {
    prompt: string;
    qualityScore: number;
    qualityExplanation: string;
    qualityDetails: PromptQualityResult;
    taskAnalysis: AnalyzedTask;
    inputIssues: {
        type: string;
        message: string;
    }[];
    suggestions: string[];
}
export declare class PromptEngine {
    private scanner;
    private resolver;
    private compressor;
    generate(root: string, userInput: string): Promise<PromptResult>;
    /**
     * Legacy method for backward compatibility
     */
    generateSimple(root: string, userInput: string): Promise<string>;
}
