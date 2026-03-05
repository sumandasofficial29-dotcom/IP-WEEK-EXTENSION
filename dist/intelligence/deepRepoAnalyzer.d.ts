export interface DeepRepoInsights {
    hasAngular: boolean;
    hasReact: boolean;
    hasSCSS: boolean;
    hasRouting: boolean;
    hasStateManagement: boolean;
    hasAngularMaterial: boolean;
    testFramework?: string;
}
export declare class DeepRepoAnalyzer {
    analyze(root: string): DeepRepoInsights;
}
