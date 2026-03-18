import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

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
  mtime?: number;  // File modification time (for file-level cache)
  hash?: string;   // Content hash (for critical files)
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
  languages: { name: string; percentage: number }[];
  frameworks: { name: string; version?: string; confidence: number }[];
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

// Cache TTL settings (in milliseconds)
const CACHE_TTL = {
  REPO_STRUCTURE: 5 * 60 * 1000,    // 5 minutes - folder structure rarely changes
  TECH_STACK: 10 * 60 * 1000,       // 10 minutes - tech stack is very stable
  FILE_ANALYSIS: 2 * 60 * 1000,     // 2 minutes - files may change more often
  SESSION_MAX: 60 * 60 * 1000,      // 1 hour - max session cache lifetime
};

// Key config files that trigger full cache invalidation
const CONFIG_FILES = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "angular.json",
  "vite.config.ts",
  "webpack.config.js",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "requirements.txt",
  "pyproject.toml",
  "CMakeLists.txt",
  "Makefile"
];

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, RepoCache> = new Map();
  private context?: vscode.ExtensionContext;
  private cacheHits = 0;
  private cacheMisses = 0;
  
  // Simple timing tracking
  private lastScanTimeMs = 0;         // Last scan duration
  private lastScanWasCached = false;  // Whether last scan used cache

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize with VS Code extension context for persistent storage
   */
  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
    this.loadPersistentCache();
  }

  /**
   * Generate a unique cache key for a repository
   */
  private getRepoCacheKey(rootPath: string): string {
    return crypto.createHash("md5").update(rootPath).digest("hex").substring(0, 12);
  }

  /**
   * Get or create repo cache
   */
  private getOrCreateRepoCache(rootPath: string): RepoCache {
    const key = this.getRepoCacheKey(rootPath);
    
    if (!this.memoryCache.has(key)) {
      this.memoryCache.set(key, {
        structure: { data: {} as RepoStructureCache, timestamp: 0 },
        techStack: { data: {} as TechStackCache, timestamp: 0 },
        files: new Map()
      });
    }
    
    return this.memoryCache.get(key)!;
  }

  /**
   * Check if cache entry is valid (not expired and file not modified)
   */
  private isCacheValid<T>(entry: CacheEntry<T>, ttl: number, filePath?: string): boolean {
    const now = Date.now();
    
    // Check TTL
    if (now - entry.timestamp > ttl) {
      return false;
    }
    
    // Check file modification time if applicable
    if (filePath && entry.mtime) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs > entry.mtime) {
          return false;
        }
      } catch {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if any config files have changed (invalidates repo-level cache)
   */
  private haveConfigFilesChanged(rootPath: string, cache: RepoCache): boolean {
    for (const configFile of CONFIG_FILES) {
      const filePath = path.join(rootPath, configFile);
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileCache = cache.files.get(filePath);
          
          if (fileCache && fileCache.mtime && stats.mtimeMs > fileCache.mtime) {
            return true;
          }
        }
      } catch {
        // File doesn't exist or can't be read
      }
    }
    return false;
  }

  // ============================================
  // REPO STRUCTURE CACHE
  // ============================================

  /**
   * Get cached repo structure or return null if invalid
   */
  getRepoStructure(rootPath: string): RepoStructureCache | null {
    const cache = this.getOrCreateRepoCache(rootPath);
    
    if (this.isCacheValid(cache.structure, CACHE_TTL.REPO_STRUCTURE) &&
        !this.haveConfigFilesChanged(rootPath, cache)) {
      this.cacheHits++;
      return cache.structure.data;
    }
    
    this.cacheMisses++;
    return null;
  }

  /**
   * Record scan timing (called after each scan)
   */
  recordScanTime(durationMs: number, wasCached: boolean): void {
    this.lastScanTimeMs = durationMs;
    this.lastScanWasCached = wasCached;
  }

  /**
   * Cache repo structure
   */
  setRepoStructure(rootPath: string, data: RepoStructureCache): void {
    const cache = this.getOrCreateRepoCache(rootPath);
    cache.structure = {
      data,
      timestamp: Date.now()
    };
    this.persistCache();
  }

  // ============================================
  // TECH STACK CACHE
  // ============================================

  /**
   * Get cached tech stack or return null if invalid
   */
  getTechStack(rootPath: string): TechStackCache | null {
    const cache = this.getOrCreateRepoCache(rootPath);
    
    if (this.isCacheValid(cache.techStack, CACHE_TTL.TECH_STACK) &&
        !this.haveConfigFilesChanged(rootPath, cache)) {
      this.cacheHits++;
      return cache.techStack.data;
    }
    
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache tech stack data
   */
  setTechStack(rootPath: string, data: TechStackCache): void {
    const cache = this.getOrCreateRepoCache(rootPath);
    cache.techStack = {
      data,
      timestamp: Date.now()
    };
    
    // Also cache config file mtimes for invalidation
    this.cacheConfigFileMtimes(rootPath, cache);
    this.persistCache();
  }

  /**
   * Cache modification times of config files
   */
  private cacheConfigFileMtimes(rootPath: string, cache: RepoCache): void {
    for (const configFile of CONFIG_FILES) {
      const filePath = path.join(rootPath, configFile);
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          cache.files.set(filePath, {
            data: { relativePath: configFile } as FileCacheData,
            timestamp: Date.now(),
            mtime: stats.mtimeMs
          });
        }
      } catch {
        // Ignore
      }
    }
  }

  // ============================================
  // FILE ANALYSIS CACHE
  // ============================================

  /**
   * Get cached file analysis or return null if invalid
   */
  getFileAnalysis(filePath: string, rootPath: string): FileCacheData | null {
    const cache = this.getOrCreateRepoCache(rootPath);
    const fileCache = cache.files.get(filePath);
    
    if (fileCache && this.isCacheValid(fileCache, CACHE_TTL.FILE_ANALYSIS, filePath)) {
      this.cacheHits++;
      return fileCache.data;
    }
    
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache file analysis
   */
  setFileAnalysis(filePath: string, rootPath: string, data: FileCacheData): void {
    const cache = this.getOrCreateRepoCache(rootPath);
    
    let mtime: number | undefined;
    try {
      const stats = fs.statSync(filePath);
      mtime = stats.mtimeMs;
    } catch {
      // Ignore
    }
    
    cache.files.set(filePath, {
      data,
      timestamp: Date.now(),
      mtime
    });
    
    // Don't persist file-level cache (too volatile)
  }

  /**
   * Get multiple file analyses at once (batch operation)
   */
  getMultipleFileAnalyses(filePaths: string[], rootPath: string): Map<string, FileCacheData | null> {
    const results = new Map<string, FileCacheData | null>();
    
    for (const filePath of filePaths) {
      results.set(filePath, this.getFileAnalysis(filePath, rootPath));
    }
    
    return results;
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Invalidate all caches for a repository
   */
  invalidateRepo(rootPath: string): void {
    const key = this.getRepoCacheKey(rootPath);
    this.memoryCache.delete(key);
    this.persistCache();
  }

  /**
   * Invalidate a specific file's cache
   */
  invalidateFile(filePath: string, rootPath: string): void {
    const cache = this.getOrCreateRepoCache(rootPath);
    cache.files.delete(filePath);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.memoryCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastScanTimeMs = 0;
    this.lastScanWasCached = false;
    
    if (this.context) {
      this.context.globalState.update("promptcraft.cache", undefined);
    }
  }

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
  } {
    const total = this.cacheHits + this.cacheMisses;
    let totalFiles = 0;
    
    for (const cache of this.memoryCache.values()) {
      totalFiles += cache.files.size;
    }
    
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? Math.round((this.cacheHits / total) * 100) : 0,
      repoCount: this.memoryCache.size,
      totalFiles,
      lastScanTimeMs: this.lastScanTimeMs,
      lastScanWasCached: this.lastScanWasCached
    };
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Persist cache to VS Code global state (repo structure + tech stack only)
   */
  private persistCache(): void {
    if (!this.context) return;

    try {
      const persistData: Record<string, { structure: CacheEntry<RepoStructureCache>; techStack: CacheEntry<TechStackCache> }> = {};
      
      for (const [key, cache] of this.memoryCache.entries()) {
        // Only persist repo-level caches, not file-level (too large)
        persistData[key] = {
          structure: cache.structure,
          techStack: cache.techStack
        };
      }
      
      this.context.globalState.update("promptcraft.cache", persistData);
    } catch (error) {
      console.error("Failed to persist cache:", error);
    }
  }

  /**
   * Load persisted cache from VS Code global state
   */
  private loadPersistentCache(): void {
    if (!this.context) return;

    try {
      const persistData = this.context.globalState.get<Record<string, { structure: CacheEntry<RepoStructureCache>; techStack: CacheEntry<TechStackCache> }>>("promptcraft.cache");
      
      if (persistData) {
        for (const [key, data] of Object.entries(persistData)) {
          // Check if persisted cache is not too old
          const maxAge = CACHE_TTL.SESSION_MAX;
          const now = Date.now();
          
          if (now - data.structure.timestamp < maxAge) {
            this.memoryCache.set(key, {
              structure: data.structure,
              techStack: data.techStack,
              files: new Map()
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load persistent cache:", error);
    }
  }

  /**
   * Warm up cache for a repository (call on extension activation)
   */
  async warmUp(rootPath: string): Promise<void> {
    // This can be called to pre-populate cache
    // The actual scanning will be done by the engine
    console.log(`[PromptCraft Cache] Warming up cache for: ${rootPath}`);
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
