/**
 * Shared context passed to all detector functions
 */
export interface DetectorContext {
    rootPath: string;
    packageJson: any;
    allDeps: string[];
    depVersions: Record<string, string>;
    fileExtensionCounts: Record<string, number>;
    sourceFileExtensionCounts: Record<string, number>;
    totalFiles: number;
    totalSourceFiles: number;
    detectedBuildSystems: string[];
    detectedTestFrameworks: string[];
}
/**
 * Helper function to check if any language files exist
 */
export declare function hasLanguageFiles(context: DetectorContext, extensions: string[]): boolean;
/**
 * Helper function to get package version
 */
export declare function getVersion(context: DetectorContext, packageName: string): string | undefined;
/**
 * Helper function to walk files in the repository
 */
export declare function walkFiles(rootPath: string, callback: (filePath: string) => void, maxDepth?: number, dir?: string, depth?: number): void;
/**
 * Helper function to check if files matching a pattern exist
 */
export declare function hasFilesMatching(rootPath: string, pattern: RegExp): boolean;
/**
 * Helper function to check for code patterns in source files
 */
export declare function hasCodePattern(rootPath: string, pattern: RegExp): boolean;
