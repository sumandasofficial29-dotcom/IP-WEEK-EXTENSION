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
    private totalFiles;
    private detectedBuildSystems;
    private detectedTestFrameworks;
    constructor(rootPath: string);
    private loadPackageJson;
    /**
     * Scan all file extensions to detect languages (works without package.json)
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
    private walkFiles;
}
