import { RepoScanResult } from "./repoScanner";
import { TechStackResult } from "./enhancedTechStackDetector";
export declare class ContextCompressor {
    private techStack;
    compress(scan: RepoScanResult): string;
    /**
     * Convert cached tech stack to full TechStackResult
     */
    private techStackCacheToResult;
    private buildFormattedContext;
    private formatProjectInfo;
    private formatTechStack;
    private formatArchitecture;
    private formatDependencies;
    private formatStructure;
    getTechStack(): TechStackResult | null;
}
