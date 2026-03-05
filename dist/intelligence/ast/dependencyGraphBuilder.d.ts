export declare function extractImports(filePath: string): string[];
export interface DependencyNode {
    filePath: string;
    imports: string[];
}
export declare function buildDependencyGraph(filePaths: string[]): DependencyNode[];
