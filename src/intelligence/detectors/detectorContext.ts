import * as fs from "fs";
import * as path from "path";

/**
 * Shared context passed to all detector functions
 */
export interface DetectorContext {
  rootPath: string;
  packageJson: any;
  allDeps: string[];
  depVersions: Record<string, string>;
  fileExtensionCounts: Record<string, number>;
  sourceFileExtensionCounts: Record<string, number>;
  totalFiles: number;
  totalSourceFiles: number;
  detectedBuildSystems: string[];
  detectedTestFrameworks: string[];
}

/**
 * Helper function to check if any language files exist
 */
export function hasLanguageFiles(context: DetectorContext, extensions: string[]): boolean {
  for (const ext of extensions) {
    if ((context.fileExtensionCounts[ext] || 0) > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Helper function to get package version
 */
export function getVersion(context: DetectorContext, packageName: string): string | undefined {
  return context.depVersions[packageName]?.replace(/[\^~]/, "");
}

/**
 * Helper function to walk files in the repository
 */
export function walkFiles(
  rootPath: string,
  callback: (filePath: string) => void,
  maxDepth: number = 6,
  dir?: string,
  depth: number = 0
): void {
  if (depth >= maxDepth) return;
  const currentDir = dir || rootPath;

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
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkFiles(rootPath, callback, maxDepth, fullPath, depth + 1);
        } else {
          callback(fullPath);
        }
      } catch {
        // Skip
      }
    }
  } catch {
    // Skip
  }
}

/**
 * Helper function to check if files matching a pattern exist
 */
export function hasFilesMatching(rootPath: string, pattern: RegExp): boolean {
  let found = false;
  walkFiles(
    rootPath,
    (filePath) => {
      if (!found && pattern.test(filePath)) {
        found = true;
      }
    },
    4
  );
  return found;
}

/**
 * Helper function to check for code patterns in source files
 */
export function hasCodePattern(rootPath: string, pattern: RegExp): boolean {
  let found = false;
  walkFiles(
    rootPath,
    (filePath) => {
      if (found) return;
      const ext = path.extname(filePath).toLowerCase();
      // Only check source files
      if ([".cpp", ".cc", ".c", ".h", ".hpp", ".py", ".java", ".ts", ".js"].includes(ext)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8").substring(0, 10000); // First 10KB
          if (pattern.test(content)) {
            found = true;
          }
        } catch {
          // Skip unreadable files
        }
      }
    },
    3
  );
  return found;
}
