/**
 * Real-time Prompt Quality Analyzer
 *
 * Purpose: Evaluate if the generated prompt will get an accurate
 * LLM response in the first try.
 *
 * Based on research showing 75% of AI suggestions are ignored and
 * only 12.5% are actually used. Good prompts = accurate solutions.
 */
export interface QualityDimension {
    name: string;
    score: number;
    weight: number;
    status: "excellent" | "good" | "fair" | "poor";
    issue?: string;
    suggestion?: string;
}
export interface PromptQualityResult {
    overallScore: number;
    likelihood: string;
    dimensions: QualityDimension[];
    criticalIssues: string[];
    improvements: string[];
    readyToUse: boolean;
}
interface AnalysisInput {
    userTask: string;
    activeFilePath?: string;
    activeFileContent?: string;
    relevantFilesCount: number;
    classesFound: number;
    methodsFound: number;
    interfacesFound: number;
    frameworkDetected?: string;
    hasRoutes: boolean;
    hasAPIs: boolean;
    dependenciesCount: number;
    repoStructureDepth: number;
}
/**
 * Analyzes prompt quality in real-time
 */
export declare function analyzePromptQuality(input: AnalysisInput): PromptQualityResult;
/**
 * Generates human-readable explanation of quality
 */
export declare function explainQuality(result: PromptQualityResult): string;
export {};
