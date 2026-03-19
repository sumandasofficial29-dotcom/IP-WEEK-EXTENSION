import { DependencyInfo, FrameworkInfo } from "./detectorTypes";
import { DetectorContext } from "./detectorContext";
/**
 * Categorize dependencies from package.json
 */
export declare function categorizeDependencies(context: DetectorContext): {
    production: DependencyInfo[];
    development: DependencyInfo[];
    byCategory: Record<string, DependencyInfo[]>;
};
/**
 * Detect project type based on frameworks, language, and build system
 */
export declare function detectProjectType(context: DetectorContext, frameworks: FrameworkInfo[], primaryLanguage: string): string;
