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
    testFrameworks?: string[];
    testCommands?: TestCommands;
    dependencyImpact?: DependencyImpact;
}
/**
 * Test commands for different types of tests detected in the project
 */
export interface TestCommands {
    unit?: string;
    integration?: string;
    e2e?: string;
    all?: string;
}
/**
 * Generates the complete LLM-optimized prompt
 */
export declare function generateSmartPrompt(ctx: PromptContext): string;
