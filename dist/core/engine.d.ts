import { PromptQualityResult } from "../intelligence/promptQualityAnalyzer";
import { AnalyzedTask } from "../intelligence/taskAnalyzer";
import { PromptOptions } from "../templates/focusedPromptGenerator";
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
export interface FocusedPromptResult {
    prompt: string;
    sections: Array<{
        id: string;
        title: string;
        content: string;
        required: boolean;
        editable: boolean;
    }>;
    taskAnalysis: AnalyzedTask;
    options: PromptOptions;
    metadata: {
        estimatedTokens: number;
        hasProjectInstructions: boolean;
        hasTestInstructions: boolean;
        primaryLanguage: string;
        frameworks: string[];
    };
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
    /**
     * NEW: Generate combined prompt with all features
     * Combines classic mode's rich context with focused mode's options
     */
    generateFocused(root: string, userInput: string, customOptions?: Partial<PromptOptions>): Promise<FocusedPromptResult>;
    /**
     * Generate custom prompt with user-specified options
     */
    generateWithOptions(root: string, userInput: string, options: PromptOptions, additionalContext?: string): Promise<string>;
}
