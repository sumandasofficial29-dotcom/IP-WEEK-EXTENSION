export interface ProjectConfig {
    copilotInstructions?: string;
    readme?: string;
    contributing?: string;
    testInstructions?: string;
    codeStyle?: string;
    customInstructions: string[];
    buildSystem?: BuildSystemConfig;
    componentDocs: ComponentDoc[];
    versioningInfo?: string;
    doxygenConfig?: string;
}
export interface BuildSystemConfig {
    type: "cmake" | "make" | "forest" | "bazel" | "meson" | "npm" | "gradle" | "maven" | "unknown";
    configFile?: string;
    buildCommands: string[];
    testCommands: string[];
}
export interface ComponentDoc {
    component: string;
    path: string;
    summary: string;
}
export interface TestingConfig {
    commands: string[];
    order?: string;
    framework?: string;
    coverage?: string;
    instructions?: string;
}
/**
 * Read project-specific configuration files that contain coding guidelines,
 * testing instructions, and other context useful for generating prompts
 * Enhanced to handle complex enterprise repos with scattered documentation
 */
export declare function readProjectConfig(rootPath: string): ProjectConfig;
/**
 * Extract testing instructions from project files
 * Enhanced to handle enterprise C++ repos and various build systems
 */
export declare function readTestingConfig(rootPath: string): TestingConfig;
