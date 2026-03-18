"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.CacheManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
// Cache TTL settings (in milliseconds)
const CACHE_TTL = {
    REPO_STRUCTURE: 5 * 60 * 1000, // 5 minutes - folder structure rarely changes
    TECH_STACK: 10 * 60 * 1000, // 10 minutes - tech stack is very stable
    FILE_ANALYSIS: 2 * 60 * 1000, // 2 minutes - files may change more often
    SESSION_MAX: 60 * 60 * 1000, // 1 hour - max session cache lifetime
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
class CacheManager {
    static instance;
    memoryCache = new Map();
    context;
    cacheHits = 0;
    cacheMisses = 0;
    // Simple timing tracking
    lastScanTimeMs = 0; // Last scan duration
    lastScanWasCached = false; // Whether last scan used cache
    constructor() { }
    static getInstance() {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
    /**
     * Initialize with VS Code extension context for persistent storage
     */
    initialize(context) {
        this.context = context;
        this.loadPersistentCache();
    }
    /**
     * Generate a unique cache key for a repository
     */
    getRepoCacheKey(rootPath) {
        return crypto.createHash("md5").update(rootPath).digest("hex").substring(0, 12);
    }
    /**
     * Get or create repo cache
     */
    getOrCreateRepoCache(rootPath) {
        const key = this.getRepoCacheKey(rootPath);
        if (!this.memoryCache.has(key)) {
            this.memoryCache.set(key, {
                structure: { data: {}, timestamp: 0 },
                techStack: { data: {}, timestamp: 0 },
                files: new Map()
            });
        }
        return this.memoryCache.get(key);
    }
    /**
     * Check if cache entry is valid (not expired and file not modified)
     */
    isCacheValid(entry, ttl, filePath) {
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
            }
            catch {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if any config files have changed (invalidates repo-level cache)
     */
    haveConfigFilesChanged(rootPath, cache) {
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
            }
            catch {
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
    getRepoStructure(rootPath) {
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
    recordScanTime(durationMs, wasCached) {
        this.lastScanTimeMs = durationMs;
        this.lastScanWasCached = wasCached;
    }
    /**
     * Cache repo structure
     */
    setRepoStructure(rootPath, data) {
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
    getTechStack(rootPath) {
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
    setTechStack(rootPath, data) {
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
    cacheConfigFileMtimes(rootPath, cache) {
        for (const configFile of CONFIG_FILES) {
            const filePath = path.join(rootPath, configFile);
            try {
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    cache.files.set(filePath, {
                        data: { relativePath: configFile },
                        timestamp: Date.now(),
                        mtime: stats.mtimeMs
                    });
                }
            }
            catch {
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
    getFileAnalysis(filePath, rootPath) {
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
    setFileAnalysis(filePath, rootPath, data) {
        const cache = this.getOrCreateRepoCache(rootPath);
        let mtime;
        try {
            const stats = fs.statSync(filePath);
            mtime = stats.mtimeMs;
        }
        catch {
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
    getMultipleFileAnalyses(filePaths, rootPath) {
        const results = new Map();
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
    invalidateRepo(rootPath) {
        const key = this.getRepoCacheKey(rootPath);
        this.memoryCache.delete(key);
        this.persistCache();
    }
    /**
     * Invalidate a specific file's cache
     */
    invalidateFile(filePath, rootPath) {
        const cache = this.getOrCreateRepoCache(rootPath);
        cache.files.delete(filePath);
    }
    /**
     * Clear all caches
     */
    clearAll() {
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
    getStats() {
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
    persistCache() {
        if (!this.context)
            return;
        try {
            const persistData = {};
            for (const [key, cache] of this.memoryCache.entries()) {
                // Only persist repo-level caches, not file-level (too large)
                persistData[key] = {
                    structure: cache.structure,
                    techStack: cache.techStack
                };
            }
            this.context.globalState.update("promptcraft.cache", persistData);
        }
        catch (error) {
            console.error("Failed to persist cache:", error);
        }
    }
    /**
     * Load persisted cache from VS Code global state
     */
    loadPersistentCache() {
        if (!this.context)
            return;
        try {
            const persistData = this.context.globalState.get("promptcraft.cache");
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
        }
        catch (error) {
            console.error("Failed to load persistent cache:", error);
        }
    }
    /**
     * Warm up cache for a repository (call on extension activation)
     */
    async warmUp(rootPath) {
        // This can be called to pre-populate cache
        // The actual scanning will be done by the engine
        console.log(`[PromptCraft Cache] Warming up cache for: ${rootPath}`);
    }
}
exports.CacheManager = CacheManager;
// Export singleton instance
exports.cacheManager = CacheManager.getInstance();
//# sourceMappingURL=cacheManager.js.map