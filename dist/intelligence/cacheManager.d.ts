import * as vscode from "vscode";
/**
 * Smart Cache Manager for PromptCraft
 *
 * Caches expensive operations like:
 * - Repository scanning (file structure)
 * - Tech stack detection (frameworks, dependencies)
 * - File analysis (imports, exports, classes)
 *
 * Cache invalidation:
 * - File-level: Based on modification time (mtime)
 * - Repo-level: Based on key config file changes
 * - TTL: Configurable time-to-live for each cache type
 */
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    mtime?: number;
    hash?: string;
}
export interface RepoCache {
    structure: CacheEntry<RepoStructureCache>;
    techStack: CacheEntry<TechStackCache>;
    files: Map<string, CacheEntry<FileCacheData>>;
}
export interface RepoStructureCache {
    fileCount: number;
    folderTree: string;
    fileList: string[];
    scanDepth: number;
}
export interface TechStackCache {
    primaryLanguage: string;
    languages: {
        name: string;
        percentage: number;
    }[];
    frameworks: {
        name: string;
        version?: string;
        confidence: number;
    }[];
    buildSystems: string[];
    testFrameworks: string[];
    projectType: string;
}
export interface FileCacheData {
    relativePath: string;
    imports: string[];
    exports: string[];
    classes: ClassCacheData[];
    functions: string[];
    size: number;
}
export interface ClassCacheData {
    name: string;
    methods: string[];
    properties: string[];
    decorators: string[];
}
export declare class CacheManager {
    private static instance;
    private memoryCache;
    private context?;
    private cacheHits;
    private cacheMisses;
    private lastScanTimeMs;
    private lastScanWasCached;
    private constructor();
    static getInstance(): CacheManager;
    /**
     * Initialize with VS Code extension context for persistent storage
     */
    initialize(context: vscode.ExtensionContext): void;
    /**
     * Generate a unique cache key for a repository
     */
    private getRepoCacheKey;
    /**
     * Get or create repo cache
     */
    private getOrCreateRepoCache;
    /**
     * Check if cache entry is valid (not expired and file not modified)
     */
    private isCacheValid;
    /**
     * Check if any config files have changed (invalidates repo-level cache)
     */
    private haveConfigFilesChanged;
    /**
     * Get cached repo structure or return null if invalid
     */
    getRepoStructure(rootPath: string): RepoStructureCache | null;
    /**
     * Record scan timing (called after each scan)
     */
    recordScanTime(durationMs: number, wasCached: boolean): void;
    /**
     * Cache repo structure
     */
    setRepoStructure(rootPath: string, data: RepoStructureCache): void;
    /**
     * Get cached tech stack or return null if invalid
     */
    getTechStack(rootPath: string): TechStackCache | null;
    /**
     * Cache tech stack data
     */
    setTechStack(rootPath: string, data: TechStackCache): void;
    /**
     * Cache modification times of config files
     */
    private cacheConfigFileMtimes;
    /**
     * Get cached file analysis or return null if invalid
     */
    getFileAnalysis(filePath: string, rootPath: string): FileCacheData | null;
    /**
     * Cache file analysis
     */
    setFileAnalysis(filePath: string, rootPath: string, data: FileCacheData): void;
    /**
     * Get multiple file analyses at once (batch operation)
     */
    getMultipleFileAnalyses(filePaths: string[], rootPath: string): Map<string, FileCacheData | null>;
    /**
     * Invalidate all caches for a repository
     */
    invalidateRepo(rootPath: string): void;
    /**
     * Invalidate a specific file's cache
     */
    invalidateFile(filePath: string, rootPath: string): void;
    /**
     * Clear all caches
     */
    clearAll(): void;
    /**
     * Get cache statistics (simple)
     */
    getStats(): {
        hits: number;
        misses: number;
        hitRate: number;
        repoCount: number;
        totalFiles: number;
        lastScanTimeMs: number;
        lastScanWasCached: boolean;
    };
    /**
     * Persist cache to VS Code global state (repo structure + tech stack only)
     */
    private persistCache;
    /**
     * Load persisted cache from VS Code global state
     */
    private loadPersistentCache;
    /**
     * Warm up cache for a repository (call on extension activation)
     */
    warmUp(_rootPath: string): Promise<void>;
}
export declare const cacheManager: CacheManager;
