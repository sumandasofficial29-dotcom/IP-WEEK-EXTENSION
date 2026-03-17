import { RepoScanResult } from "./repoScanner";
import { TechStackResult } from "./enhancedTechStackDetector";
export declare class ContextCompressor {
    private techStack;
    compress(scan: RepoScanResult): string;
    private buildFormattedContext;
    private formatProjectInfo;
    private formatTechStack;
    private formatArchitecture;
    private formatDependencies;
    private formatStructure;
    getTechStack(): TechStackResult | null;
}
