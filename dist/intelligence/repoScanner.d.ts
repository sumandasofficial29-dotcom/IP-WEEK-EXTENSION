import { DeepRepoInsights } from "./deepRepoAnalyzer";
import { RepoStructure } from "./ast/types";
import { DependencyNode } from "./ast/dependencyGraphBuilder";
export interface RepoScanResult {
    projectRoot: string;
    dependencies: Record<string, string>;
    insights: DeepRepoInsights;
    fileTree: string;
    isAngular: boolean;
    isReact: boolean;
    structure: RepoStructure;
    dependencyGraph: DependencyNode[];
}
export declare class RepoScanner {
    private rootDetector;
    private depAnalyzer;
    private deepAnalyzer;
    scan(workspaceRoot: string): Promise<RepoScanResult>;
    private collectTsFiles;
    private buildStructure;
}
