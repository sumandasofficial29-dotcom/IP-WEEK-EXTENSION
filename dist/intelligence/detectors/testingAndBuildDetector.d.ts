import { DetectorContext } from "./detectorContext";
/**
 * Detect testing frameworks
 */
export declare function detectTesting(context: DetectorContext): {
    framework?: string;
    e2e?: string;
    coverage?: string;
};
/**
 * Detect build systems from files
 */
export declare function detectBuildSystemsFromFiles(context: DetectorContext): string[];
/**
 * Detect build tools (bundlers, transpilers, build systems)
 */
export declare function detectBuildTools(context: DetectorContext): {
    bundler?: string;
    transpiler?: string;
    buildSystem?: string;
};
