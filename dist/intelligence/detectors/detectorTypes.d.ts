/**
 * Shared type definitions for modular tech stack detectors
 */
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
export interface CppBMSResult {
    isBms: boolean;
    indicators: string[];
    bmsInfo?: {
        modules: string[];
        designPatterns: string[];
        middlewarePatterns: string[];
        middlewareVersion?: string;
        cppStandard?: string;
        bmsDependencies: string[];
        submodules: string[];
    };
}
