/**
 * Build system signatures for detection
 */
export declare const BUILD_SYSTEM_SIGNATURES: Record<string, {
    files: string[];
    indicators: string[];
    language?: string;
}>;
/**
 * Testing framework detection (multi-language)
 */
export declare const TESTING_FRAMEWORKS: Record<string, {
    files: string[];
    patterns: RegExp[];
    language?: string;
}>;
