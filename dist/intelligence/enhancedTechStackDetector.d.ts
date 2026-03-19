import { TechStackResult, FrameworkInfo, ArchitectureInfo, DependencyInfo } from "./detectors/detectorTypes";
export { FrameworkInfo, ArchitectureInfo, DependencyInfo, TechStackResult };
/**
 * Orchestrates all specialized detectors to analyze tech stack
 */
export declare class EnhancedTechStackDetector {
    private rootPath;
    private context;
    private static DATA_DIRECTORIES;
    private static CONFIG_EXTENSIONS;
    constructor(rootPath: string);
    private loadPackageJson;
    /**
     * Scan all file extensions to detect languages (works without package.json)
     * Separates source files from data/config files for accurate language detection
     */
    private scanFileExtensions;
    /**
     * Main entry point - orchestrates all detectors
     */
    analyze(): TechStackResult;
    /**
     * Walk files for language detection (considers source vs data directories)
     */
    private walkFilesForLanguage;
}
