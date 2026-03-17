/**
 * Targeted Context Extractor
 *
 * Extracts only the code context that's relevant to the user's task.
 * Avoids information overload by focusing on what matters.
 */
import { AnalyzedTask } from "./taskAnalyzer";
import { ClassInfo } from "./ast/types";
export interface TargetedContext {
    primaryFile?: FileContext;
    relatedFiles: FileContext[];
    relatedClasses: ClassContext[];
    imports: string[];
    usedBy: string[];
    summary: string;
}
export interface FileContext {
    path: string;
    relativePath: string;
    relevanceScore: number;
    relevanceReason: string;
    fullContent?: string;
    relevantSections: CodeSection[];
    exports: string[];
    imports: string[];
}
export interface ClassContext {
    name: string;
    filePath: string;
    type: "class" | "interface" | "type" | "enum";
    relevance: string;
    properties: {
        name: string;
        type: string;
    }[];
    methods: {
        name: string;
        signature: string;
    }[];
    declaration: string;
}
export interface CodeSection {
    startLine: number;
    endLine: number;
    content: string;
    reason: string;
}
/**
 * Extracts targeted context based on the analyzed task
 */
export declare function extractTargetedContext(task: AnalyzedTask, projectRoot: string, activeFilePath?: string, activeFileContent?: string, availableClasses?: ClassInfo[]): TargetedContext;
/**
 * Formats the targeted context for inclusion in the prompt
 */
export declare function formatTargetedContext(context: TargetedContext): string;
