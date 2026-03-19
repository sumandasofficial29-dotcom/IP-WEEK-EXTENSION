import { AnalyzedTask } from "../intelligence/taskAnalyzer";
import { DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";
import { TestCommands } from "./smartPromptGenerator";
/**
 * Focused Prompt Generator v2 - COMBINED MODE
 *
 * Design principles:
 * 1. CONCISE - No bloat, every word must add value
 * 2. CONTEXTUAL - Use actual project config + repo context
 * 3. ACTIONABLE - Clear, specific instructions for the LLM
 * 4. CUSTOMIZABLE - User can edit before sending
 * 5. EXPLANATION-FOCUSED - Ask for reasoning, not just code
 * 6. RICH CONTEXT - Includes folder structure, dependencies, quality checks
 */
export interface FocusedPromptInput {
    userRequest: string;
    task: AnalyzedTask;
    rootPath: string;
    activeFilePath?: string;
    activeFileContent?: string;
    primaryLanguage: string;
    frameworks: string[];
    relevantCode?: string;
    repoContext?: string;
    codeContext?: string;
    scenario?: string;
    framework?: string;
    testFramework?: string;
    testFrameworks?: string[];
    testCommands?: TestCommands;
    dependencyImpact?: DependencyImpact;
    options?: PromptOptions;
}
export interface FocusedPromptOutput {
    prompt: string;
    sections: PromptSection[];
    editable: boolean;
    metadata: {
        estimatedTokens: number;
        hasProjectInstructions: boolean;
        hasTestInstructions: boolean;
        hasRepoContext?: boolean;
        hasDependencyAnalysis?: boolean;
    };
}
export interface PromptSection {
    id: string;
    title: string;
    content: string;
    required: boolean;
    editable: boolean;
}
/**
 * Generate a focused, value-adding prompt with FULL repo context
 * Combines classic mode's rich context with focused mode's clarity
 */
export declare function generateFocusedPrompt(input: FocusedPromptInput): FocusedPromptOutput;
/**
 * Generate prompt with user customization options
 * NOTE: No code included - Copilot already sees the active file
 */
export interface PromptOptions {
    includeExplanation: boolean;
    includeDocumentation: boolean;
    includeTests: boolean;
    includeProjectInstructions: boolean;
    additionalContext?: string;
}
export declare function generateCustomPrompt(input: FocusedPromptInput, options: PromptOptions): string;
/**
 * Get default options based on task type
 */
export declare function getDefaultOptions(task: AnalyzedTask): PromptOptions;
