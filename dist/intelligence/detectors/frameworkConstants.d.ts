/**
 * Framework signatures for detection
 */
export declare const FRAMEWORK_SIGNATURES: Record<string, {
    packages: string[];
    files: string[];
    codePatterns?: RegExp[];
}>;
/**
 * State management libraries
 */
export declare const STATE_LIBRARIES: Record<string, string[]>;
/**
 * Styling libraries and preprocessors
 */
export declare const STYLING_LIBS: Record<string, string[]>;
/**
 * Build tools
 */
export declare const BUILD_TOOLS: Record<string, {
    packages: string[];
    configs: string[];
}>;
/**
 * Testing frameworks for JavaScript/TypeScript
 */
export declare const TEST_FRAMEWORKS: Record<string, {
    packages: string[];
    configs: string[];
}>;
/**
 * Dependency categorization
 */
export declare const DEPENDENCY_CATEGORIES: Record<string, string[]>;
