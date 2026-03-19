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
exports.EnhancedTechStackDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const frameworkDetector_1 = require("./detectors/frameworkDetector");
const languageDetector_1 = require("./detectors/languageDetector");
const architectureDetector_1 = require("./detectors/architectureDetector");
const testingAndBuildDetector_1 = require("./detectors/testingAndBuildDetector");
const dependencyDetector_1 = require("./detectors/dependencyDetector");
/**
 * Orchestrates all specialized detectors to analyze tech stack
 */
class EnhancedTechStackDetector {
    rootPath;
    context;
    // Directories that contain data/config, not source code
    static DATA_DIRECTORIES = new Set([
        "regression",
        "regression_tests",
        "regression_tools",
        "profiles_regression",
        "data",
        "test_data",
        "testdata",
        "fixtures",
        "mocks",
        "profiles",
        "reports",
        "logs",
        "output",
        "results",
        "swb_resources",
        "sit_application",
        "localbmstmp",
        "bmstmp",
        "content",
        "distribution",
        "versions"
    ]);
    // Extensions that are config/data, not source code
    static CONFIG_EXTENSIONS = new Set([
        ".json",
        ".yaml",
        ".yml",
        ".xml",
        ".toml",
        ".ini",
        ".env",
        ".properties",
        ".config",
        ".conf",
        ".data",
        ".dat",
        ".csv",
        ".tsv",
        ".lock",
        ".log",
        ".md",
        ".txt",
        ".rst"
    ]);
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.context = {
            rootPath,
            packageJson: null,
            allDeps: [],
            depVersions: {},
            fileExtensionCounts: {},
            sourceFileExtensionCounts: {},
            totalFiles: 0,
            totalSourceFiles: 0,
            detectedBuildSystems: [],
            detectedTestFrameworks: []
        };
        this.loadPackageJson();
        this.scanFileExtensions();
    }
    loadPackageJson() {
        const pkgPath = path.join(this.rootPath, "package.json");
        if (fs.existsSync(pkgPath)) {
            try {
                this.context.packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
                const deps = this.context.packageJson.dependencies || {};
                const devDeps = this.context.packageJson.devDependencies || {};
                const peerDeps = this.context.packageJson.peerDependencies || {};
                this.context.depVersions = { ...deps, ...devDeps, ...peerDeps };
                this.context.allDeps = Object.keys(this.context.depVersions);
            }
            catch {
                this.context.packageJson = null;
            }
        }
    }
    /**
     * Scan all file extensions to detect languages (works without package.json)
     * Separates source files from data/config files for accurate language detection
     */
    scanFileExtensions() {
        this.walkFilesForLanguage((filePath, isSourceDir) => {
            const ext = path.extname(filePath).toLowerCase();
            if (ext) {
                this.context.fileExtensionCounts[ext] =
                    (this.context.fileExtensionCounts[ext] || 0) + 1;
                this.context.totalFiles++;
                // Track source files separately (in src/ and not config/data files)
                if (isSourceDir && !EnhancedTechStackDetector.CONFIG_EXTENSIONS.has(ext)) {
                    this.context.sourceFileExtensionCounts[ext] =
                        (this.context.sourceFileExtensionCounts[ext] || 0) + 1;
                    this.context.totalSourceFiles++;
                }
            }
        }, 6);
    }
    /**
     * Main entry point - orchestrates all detectors
     */
    analyze() {
        // Detect frameworks first as they're needed by other detectors
        const frameworks = (0, frameworkDetector_1.detectFrameworks)(this.context);
        // Detect languages
        const primaryLanguage = (0, languageDetector_1.detectPrimaryLanguage)(this.context);
        const languages = (0, languageDetector_1.detectLanguages)(this.context);
        // Analyze architecture (includes testing and build detection)
        const architecture = (0, architectureDetector_1.analyzeArchitecture)(this.context);
        // Detect testing and build tools and update architecture
        const testing = (0, testingAndBuildDetector_1.detectTesting)(this.context);
        const build = (0, testingAndBuildDetector_1.detectBuildTools)(this.context);
        architecture.testing = testing;
        architecture.build = build;
        // Categorize dependencies
        const dependencies = (0, dependencyDetector_1.categorizeDependencies)(this.context);
        // Detect project type
        const projectType = (0, dependencyDetector_1.detectProjectType)(this.context, frameworks, primaryLanguage);
        return {
            frameworks,
            primaryLanguage,
            languages,
            architecture,
            dependencies,
            projectType
        };
    }
    /**
     * Walk files for language detection (considers source vs data directories)
     */
    walkFilesForLanguage(callback, maxDepth = 6, dir, depth = 0, isInDataDir = false) {
        if (depth >= maxDepth)
            return;
        const currentDir = dir || this.rootPath;
        try {
            const entries = fs.readdirSync(currentDir);
            for (const entry of entries) {
                // Skip hidden folders and common non-source directories
                if (entry.startsWith(".") ||
                    [
                        "node_modules",
                        "dist",
                        "build",
                        "coverage",
                        ".git",
                        "vendor",
                        "__pycache__",
                        "target",
                        "bin",
                        "obj",
                        ".vs",
                        ".idea"
                    ].includes(entry)) {
                    continue;
                }
                const fullPath = path.join(currentDir, entry);
                const entryLower = entry.toLowerCase();
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        // Check if this directory is a data directory
                        const isDataDir = isInDataDir || EnhancedTechStackDetector.DATA_DIRECTORIES.has(entryLower);
                        this.walkFilesForLanguage(callback, maxDepth, fullPath, depth + 1, isDataDir);
                    }
                    else {
                        // File is in a source directory if we're not in a data directory
                        callback(fullPath, !isInDataDir);
                    }
                }
                catch {
                    // Skip
                }
            }
        }
        catch {
            // Skip
        }
    }
}
exports.EnhancedTechStackDetector = EnhancedTechStackDetector;
//# sourceMappingURL=enhancedTechStackDetector.js.map