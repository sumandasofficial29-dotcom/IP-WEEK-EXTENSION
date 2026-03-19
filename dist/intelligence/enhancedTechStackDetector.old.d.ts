export interface FrameworkInfo {
    name: string;
    version?: string;
    confidence: number;
    indicators: string[];
}
export interface ArchitectureInfo {
    patterns: string[];
    styling: {
        preprocessor?: string;
        framework?: string;
        methodology?: string;
    };
    testing: {
        framework?: string;
        e2e?: string;
        coverage?: string;
    };
    stateManagement: {
        library?: string;
        pattern?: string;
    };
    routing: {
        type?: string;
        routes: string[];
    };
    api: {
        client?: string;
        style?: string;
    };
    build: {
        bundler?: string;
        transpiler?: string;
        buildSystem?: string;
    };
    bms?: {
        modules: string[];
        designPatterns: string[];
        middlewarePatterns: string[];
        middlewareVersion?: string;
        cppStandard?: string;
        bmsDependencies: string[];
        submodules: string[];
    };
}
export interface DependencyInfo {
    name: string;
    version: string;
    type: "production" | "development";
    category: string;
}
export interface TechStackResult {
    frameworks: FrameworkInfo[];
    primaryLanguage: string;
    languages: {
        name: string;
        percentage: number;
    }[];
    architecture: ArchitectureInfo;
    dependencies: {
        production: DependencyInfo[];
        development: DependencyInfo[];
        byCategory: Record<string, DependencyInfo[]>;
    };
    projectType: string;
}
export declare class EnhancedTechStackDetector {
    private rootPath;
    private packageJson;
    private allDeps;
    private depVersions;
    private fileExtensionCounts;
    private sourceFileExtensionCounts;
    private totalFiles;
    private totalSourceFiles;
    private detectedBuildSystems;
    private detectedTestFrameworks;
    private static DATA_DIRECTORIES;
    private static CONFIG_EXTENSIONS;
    constructor(rootPath: string);
    private loadPackageJson;
    /**
     * Scan all file extensions to detect languages (works without package.json)
     * Separates source files from data/config files for accurate language detection
     */
    private scanFileExtensions;
    analyze(): TechStackResult;
    private detectFrameworks;
    private detectPrimaryLanguage;
    private detectLanguages;
    private analyzeArchitecture;
    private detectPatterns;
    private detectBuildSystemsFromFiles;
    private detectTesting;
    private detectBuildTools;
    private detectProjectType;
    private hasLanguageFiles;
    private hasCodePattern;
    private getVersion;
    private detectStyling;
    private detectStateManagement;
    private detectRouting;
    private detectAPIStyle;
    private categorizeDependencies;
    private hasDirectory;
    private hasFilesMatching;
    /**
     * Verify that a language (from build system detection) actually has source files in the repo.
     * This prevents false positives like Description.xml triggering C++ in an Angular repo.
     */
    private verifyLanguageHasFiles;
    /**
     * Detect C++ BMS/MDW projects (C++ middleware framework)
     */
    private detectCppBMS;
    private walkFiles;
    /**
     * Walk files and track whether they are in source directories vs data/config directories.
     * This helps separate actual source code from test data, regression files, etc.
     */
    private walkFilesForLanguage;
}
