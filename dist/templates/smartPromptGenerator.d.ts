import { ScenarioType } from "./scenarioBlueprints";
import { AnalyzedTask } from "../intelligence/taskAnalyzer";
import { DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";
/**
 * LLM-Optimized Prompt Generator
 *
 * Uses proven prompting techniques:
 * - Clear system role
 * - Chain-of-thought reasoning
 * - Structured output format
 * - Context grounding
 * - Task verification
 */
export interface PromptContext {
    scenario: ScenarioType;
    framework: string;
    task: AnalyzedTask;
    repoContext: string;
    codeContext: string;
    testFramework?: string;
    dependencyImpact?: DependencyImpact;
}
/**
 * Generates the complete LLM-optimized prompt
 */
export declare function generateSmartPrompt(ctx: PromptContext): string;
