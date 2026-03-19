import { ArchitectureInfo } from "./detectorTypes";
import { DetectorContext } from "./detectorContext";
/**
 * Detect architectural patterns
 */
export declare function detectPatterns(context: DetectorContext): string[];
/**
 * Detect styling technologies
 */
export declare function detectStyling(context: DetectorContext): {
    preprocessor?: string;
    framework?: string;
    methodology?: string;
};
/**
 * Detect state management
 */
export declare function detectStateManagement(context: DetectorContext): {
    library?: string;
    pattern?: string;
};
/**
 * Detect routing settings
 */
export declare function detectRouting(context: DetectorContext): {
    type?: string;
    routes: string[];
};
/**
 * Detect API style and client
 */
export declare function detectAPIStyle(context: DetectorContext): {
    client?: string;
    style?: string;
};
/**
 * Main architecture analyzer
 */
export declare function analyzeArchitecture(context: DetectorContext): ArchitectureInfo;
