export interface FileStructureOptions {
    maxDepth: number;
    maxItemsPerLevel: number;
    showFileCount: boolean;
    prioritizeFolders: boolean;
}
export declare class FileStructureBuilder {
    private options;
    constructor(options?: Partial<FileStructureOptions>);
    build(rootPath: string): string;
    private buildTree;
    private sortEntries;
    private getPriority;
    private limitEntries;
    private countFiles;
    private renderTree;
}
/**
 * Creates a compact structure summary for LLM context
 */
export declare function buildCompactStructure(rootPath: string): string;
