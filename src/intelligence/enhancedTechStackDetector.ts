import * as fs from "fs";
import * as path from "path";
import {
  TechStackResult,
  FrameworkInfo,
  ArchitectureInfo,
  DependencyInfo
} from "./detectors/detectorTypes";
import { DetectorContext } from "./detectors/detectorContext";
import { detectFrameworks } from "./detectors/frameworkDetector";
import { detectPrimaryLanguage, detectLanguages } from "./detectors/languageDetector";
import { analyzeArchitecture } from "./detectors/architectureDetector";
import { detectTesting, detectBuildTools } from "./detectors/testingAndBuildDetector";
import {
  categorizeDependencies,
  detectProjectType
} from "./detectors/dependencyDetector";

// Re-export types for backward compatibility
export { FrameworkInfo, ArchitectureInfo, DependencyInfo, TechStackResult };

/**
 * Orchestrates all specialized detectors to analyze tech stack
 */
export class EnhancedTechStackDetector {
  private rootPath: string;
  private context: DetectorContext;

  // Directories that contain data/config, not source code
  private static DATA_DIRECTORIES = new Set([
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
  private static CONFIG_EXTENSIONS = new Set([
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

  constructor(rootPath: string) {
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

  private loadPackageJson(): void {
    const pkgPath = path.join(this.rootPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        this.context.packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

        const deps = this.context.packageJson.dependencies || {};
        const devDeps = this.context.packageJson.devDependencies || {};
        const peerDeps = this.context.packageJson.peerDependencies || {};

        this.context.depVersions = { ...deps, ...devDeps, ...peerDeps };
        this.context.allDeps = Object.keys(this.context.depVersions);
      } catch {
        this.context.packageJson = null;
      }
    }
  }

  /**
   * Scan all file extensions to detect languages (works without package.json)
   * Separates source files from data/config files for accurate language detection
   */
  private scanFileExtensions(): void {
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
  analyze(): TechStackResult {
    // Detect frameworks first as they're needed by other detectors
    const frameworks = detectFrameworks(this.context);

    // Detect languages
    const primaryLanguage = detectPrimaryLanguage(this.context);
    const languages = detectLanguages(this.context);

    // Analyze architecture (includes testing and build detection)
    const architecture = analyzeArchitecture(this.context);

    // Detect testing and build tools and update architecture
    const testing = detectTesting(this.context);
    const build = detectBuildTools(this.context);
    architecture.testing = testing;
    architecture.build = build;

    // Categorize dependencies
    const dependencies = categorizeDependencies(this.context);

    // Detect project type
    const projectType = detectProjectType(this.context, frameworks, primaryLanguage);

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
  private walkFilesForLanguage(
    callback: (filePath: string, isSourceDir: boolean) => void,
    maxDepth: number = 6,
    dir?: string,
    depth: number = 0,
    isInDataDir: boolean = false
  ): void {
    if (depth >= maxDepth) return;
    const currentDir = dir || this.rootPath;

    try {
      const entries = fs.readdirSync(currentDir);
      for (const entry of entries) {
        // Skip hidden folders and common non-source directories
        if (
          entry.startsWith(".") ||
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
          ].includes(entry)
        ) {
          continue;
        }

        const fullPath = path.join(currentDir, entry);
        const entryLower = entry.toLowerCase();

        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            // Check if this directory is a data directory
            const isDataDir =
              isInDataDir || EnhancedTechStackDetector.DATA_DIRECTORIES.has(entryLower);
            this.walkFilesForLanguage(callback, maxDepth, fullPath, depth + 1, isDataDir);
          } else {
            // File is in a source directory if we're not in a data directory
            callback(fullPath, !isInDataDir);
          }
        } catch {
          // Skip
        }
      }
    } catch {
      // Skip
    }
  }
}
