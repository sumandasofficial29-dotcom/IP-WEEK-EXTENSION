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
    constructor(rootPath: string);
    private loadPackageJson;
    analyze(): TechStackResult;
    private detectFrameworks;
    private detectPrimaryLanguage;
    private detectLanguages;
    private analyzeArchitecture;
    private detectPatterns;
    private detectStyling;
    private detectTesting;
    private detectStateManagement;
    private detectRouting;
    private detectAPIStyle;
    private detectBuildTools;
    private categorizeDependencies;
    private detectProjectType;
    private getVersion;
    private hasDirectory;
    private hasFilesMatching;
    private walkFiles;
}
