/**
 * Dependency Impact Analyzer
 *
 * Tracks what files depend on the target file and what might break
 * when changes are made. Critical for safe refactoring.
 */
export interface DependencyImpact {
    dependentFiles: DependentFile[];
    importedModules: ImportedModule[];
    exposedExports: ExposedExport[];
    impactLevel: "low" | "medium" | "high" | "critical";
    warnings: string[];
    summary: string;
}
export interface DependentFile {
    filePath: string;
    relativePath: string;
    importsUsed: string[];
    usageCount: number;
    couldBreak: boolean;
}
export interface ImportedModule {
    modulePath: string;
    imports: string[];
    isRelative: boolean;
}
export interface ExposedExport {
    name: string;
    type: "class" | "function" | "interface" | "type" | "const" | "enum";
    usedByFiles: string[];
    usageCount: number;
}
/**
 * Analyzes the impact of changing a file
 */
export declare function analyzeDependencyImpact(targetFilePath: string, projectRoot: string): DependencyImpact;
/**
 * Quick check to get list of files that import from a given file
 */
export declare function getFilesImportingFrom(targetFilePath: string, projectRoot: string): string[];
