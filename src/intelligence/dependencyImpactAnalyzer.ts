/**
 * Dependency Impact Analyzer
 * 
 * Tracks what files depend on the target file and what might break
 * when changes are made. Critical for safe refactoring.
 */

import * as fs from "fs";
import * as path from "path";

export interface DependencyImpact {
  // Files that IMPORT from the target (dependents - could break)
  dependentFiles: DependentFile[];
  
  // Files that the target IMPORTS from (dependencies)
  importedModules: ImportedModule[];
  
  // Exports from target file that are used elsewhere
  exposedExports: ExposedExport[];
  
  // Impact summary
  impactLevel: "low" | "medium" | "high" | "critical";
  warnings: string[];
  
  // For LLM
  summary: string;
}

export interface DependentFile {
  filePath: string;
  relativePath: string;
  importsUsed: string[];    // What symbols they import from target
  usageCount: number;       // How many times those symbols are used
  couldBreak: boolean;      // If changes might break this file
}

export interface ImportedModule {
  modulePath: string;
  imports: string[];        // What's imported from this module
  isRelative: boolean;      // Local file vs npm package
}

export interface ExposedExport {
  name: string;
  type: "class" | "function" | "interface" | "type" | "const" | "enum";
  usedByFiles: string[];
  usageCount: number;
}

/**
 * Analyzes the impact of changing a file
 */
export function analyzeDependencyImpact(
  targetFilePath: string,
  projectRoot: string
): DependencyImpact {
  const targetContent = readFileSafe(targetFilePath);
  if (!targetContent) {
    return createEmptyImpact();
  }

  const relativePath = path.relative(projectRoot, targetFilePath).replace(/\\/g, "/");
  const targetName = path.basename(targetFilePath, path.extname(targetFilePath));

  // 1. Find what the target file exports
  const exports = extractExports(targetContent);

  // 2. Find files that import from target (dependents)
  const dependentFiles = findDependentFiles(projectRoot, targetName, relativePath, exports);

  // 3. Find what target imports (dependencies)
  const importedModules = extractImports(targetContent);

  // 4. Map exports to their usages
  const exposedExports = mapExportsToUsages(exports, dependentFiles);

  // 5. Calculate impact level
  const impactLevel = calculateImpactLevel(dependentFiles, exposedExports);

  // 6. Generate warnings
  const warnings = generateWarnings(dependentFiles, exposedExports, importedModules);

  // 7. Generate summary for LLM
  const summary = generateImpactSummary(
    dependentFiles,
    importedModules,
    exposedExports,
    impactLevel,
    warnings
  );

  return {
    dependentFiles,
    importedModules,
    exposedExports,
    impactLevel,
    warnings,
    summary
  };
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function createEmptyImpact(): DependencyImpact {
  return {
    dependentFiles: [],
    importedModules: [],
    exposedExports: [],
    impactLevel: "low",
    warnings: [],
    summary: "No dependency impact analysis available."
  };
}

interface ExportInfo {
  name: string;
  type: "class" | "function" | "interface" | "type" | "const" | "enum";
}

function extractExports(content: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  
  const patterns: { regex: RegExp; type: ExportInfo["type"] }[] = [
    { regex: /export\s+class\s+(\w+)/g, type: "class" },
    { regex: /export\s+interface\s+(\w+)/g, type: "interface" },
    { regex: /export\s+type\s+(\w+)/g, type: "type" },
    { regex: /export\s+enum\s+(\w+)/g, type: "enum" },
    { regex: /export\s+const\s+(\w+)/g, type: "const" },
    { regex: /export\s+function\s+(\w+)/g, type: "function" },
    { regex: /export\s+async\s+function\s+(\w+)/g, type: "function" },
    { regex: /export\s+\{\s*([^}]+)\s*\}/g, type: "const" }, // Re-exports
  ];

  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1].includes(",")) {
        // Multiple exports: export { A, B, C }
        const names = match[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0].trim());
        for (const name of names) {
          if (name && !exports.find(e => e.name === name)) {
            exports.push({ name, type });
          }
        }
      } else {
        const name = match[1].trim();
        if (name && !exports.find(e => e.name === name)) {
          exports.push({ name, type });
        }
      }
    }
  }

  // Also check default export
  if (/export\s+default/.test(content)) {
    exports.push({ name: "default", type: "const" });
  }

  return exports;
}

function extractImports(content: string): ImportedModule[] {
  const imports: ImportedModule[] = [];
  
  // Match: import { X, Y } from 'module'
  // Match: import X from 'module'
  // Match: import * as X from 'module'
  const importRegex = /import\s+(?:(\*\s+as\s+\w+)|(\w+)|(\{[^}]+\}))\s*(?:,\s*(?:(\*\s+as\s+\w+)|(\w+)|(\{[^}]+\})))?\s*from\s+['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const modulePath = match[7];
    const importedNames: string[] = [];

    // Extract imported names
    for (let i = 1; i <= 6; i++) {
      if (match[i]) {
        if (match[i].startsWith("{")) {
          // Named imports
          const names = match[i].slice(1, -1).split(",").map(n => {
            const parts = n.trim().split(/\s+as\s+/);
            return parts[0].trim();
          });
          importedNames.push(...names.filter(n => n));
        } else if (match[i].startsWith("*")) {
          importedNames.push(match[i]); // Namespace import
        } else {
          importedNames.push(match[i]); // Default import
        }
      }
    }

    imports.push({
      modulePath,
      imports: importedNames,
      isRelative: modulePath.startsWith(".") || modulePath.startsWith("/")
    });
  }

  return imports;
}

function findDependentFiles(
  projectRoot: string,
  targetName: string,
  _targetRelativePath: string,
  targetExports: ExportInfo[]
): DependentFile[] {
  const dependents: DependentFile[] = [];
  const searchDirs = ["src", "lib", "app"];

  // Build patterns to search for
  const importPatterns = [
    `from './${targetName}'`,
    `from "./${targetName}"`,
    `from '${targetName}'`,
    `from "${targetName}"`,
    // Handle deeper paths
    new RegExp(`from\\s+['"][^'"]*${escapeRegex(targetName)}['"]`)
  ];

  for (const dir of searchDirs) {
    const fullDir = path.join(projectRoot, dir);
    searchDirForImports(fullDir, importPatterns, targetName, targetExports, dependents);
  }

  return dependents;
}

function searchDirForImports(
  dir: string,
  patterns: (string | RegExp)[],
  targetName: string,
  targetExports: ExportInfo[],
  results: DependentFile[]
): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        searchDirForImports(fullPath, patterns, targetName, targetExports, results);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const content = readFileSafe(fullPath);
        if (!content) continue;

        // Check if this file imports from target
        const imports = patterns.some(pattern => {
          if (typeof pattern === "string") {
            return content.includes(pattern);
          }
          return pattern.test(content);
        });

        if (imports) {
          // Find which exports are used
          const importsUsed: string[] = [];
          let usageCount = 0;

          for (const exp of targetExports) {
            const regex = new RegExp(`\\b${escapeRegex(exp.name)}\\b`, "g");
            const matches = content.match(regex);
            if (matches && matches.length > 0) {
              importsUsed.push(exp.name);
              usageCount += matches.length;
            }
          }

          if (importsUsed.length > 0) {
            results.push({
              filePath: fullPath,
              relativePath: entry.name,
              importsUsed,
              usageCount,
              couldBreak: usageCount > 0
            });
          }
        }
      }
    }
  } catch {
    // Directory not accessible
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapExportsToUsages(
  exports: ExportInfo[],
  dependents: DependentFile[]
): ExposedExport[] {
  return exports.map(exp => {
    const usedByFiles: string[] = [];
    let totalUsage = 0;

    for (const dep of dependents) {
      if (dep.importsUsed.includes(exp.name)) {
        usedByFiles.push(dep.relativePath);
        totalUsage += dep.usageCount;
      }
    }

    return {
      name: exp.name,
      type: exp.type,
      usedByFiles,
      usageCount: totalUsage
    };
  }).filter(e => e.usedByFiles.length > 0);
}

function calculateImpactLevel(
  dependents: DependentFile[],
  exports: ExposedExport[]
): "low" | "medium" | "high" | "critical" {
  const dependentCount = dependents.length;
  const totalUsages = exports.reduce((sum, e) => sum + e.usageCount, 0);

  if (dependentCount === 0) return "low";
  if (dependentCount >= 10 || totalUsages >= 50) return "critical";
  if (dependentCount >= 5 || totalUsages >= 20) return "high";
  if (dependentCount >= 2 || totalUsages >= 5) return "medium";
  return "low";
}

function generateWarnings(
  dependents: DependentFile[],
  exports: ExposedExport[],
  imports: ImportedModule[]
): string[] {
  const warnings: string[] = [];

  // Heavily used exports
  for (const exp of exports) {
    if (exp.usageCount >= 10) {
      warnings.push(`⚠️ "${exp.name}" is used ${exp.usageCount} times across ${exp.usedByFiles.length} files - changes here have wide impact`);
    }
  }

  // Many dependents
  if (dependents.length >= 5) {
    warnings.push(`⚠️ ${dependents.length} files depend on this module - validate all after changes`);
  }

  // Public API changes
  const publicExports = exports.filter(e => e.type === "class" || e.type === "function" || e.type === "interface");
  if (publicExports.length > 0 && dependents.length > 0) {
    warnings.push(`⚠️ Changing public API (${publicExports.map(e => e.name).join(", ")}) may require updates in dependent files`);
  }

  // Circular dependency risk (if importing from files that also import from us)
  const relativeImports = imports.filter(i => i.isRelative);
  if (relativeImports.length > 3) {
    warnings.push(`ℹ️ This file has ${relativeImports.length} local imports - verify no circular dependencies`);
  }

  return warnings;
}

function generateImpactSummary(
  dependents: DependentFile[],
  imports: ImportedModule[],
  exports: ExposedExport[],
  impactLevel: string,
  warnings: string[]
): string {
  const lines: string[] = [];

  lines.push(`## Dependency Impact Analysis`);
  lines.push(`**Impact Level:** ${impactLevel.toUpperCase()}`);
  lines.push("");

  // Files that depend on this one
  if (dependents.length > 0) {
    lines.push(`### Files That Could Be Affected (${dependents.length})`);
    lines.push(`These files import from the target - changes may break them:`);
    lines.push("");
    for (const dep of dependents.slice(0, 10)) {
      lines.push(`- **${dep.relativePath}** uses: \`${dep.importsUsed.join("`, `")}\` (${dep.usageCount} usages)`);
    }
    if (dependents.length > 10) {
      lines.push(`- ... and ${dependents.length - 10} more files`);
    }
    lines.push("");
  }

  // Exports that are used externally
  if (exports.length > 0) {
    lines.push(`### Exposed API (Used Externally)`);
    lines.push(`These exports are used by other files - signature changes require updates:`);
    lines.push("");
    for (const exp of exports.slice(0, 8)) {
      lines.push(`- \`${exp.name}\` (${exp.type}) - used in ${exp.usedByFiles.length} files`);
    }
    lines.push("");
  }

  // Dependencies (files this imports)
  const relativeImports = imports.filter(i => i.isRelative);
  if (relativeImports.length > 0) {
    lines.push(`### Dependencies (Local Files Used)`);
    lines.push(`This file imports from these local modules:`);
    lines.push("");
    for (const imp of relativeImports.slice(0, 5)) {
      lines.push(`- \`${imp.modulePath}\` → { ${imp.imports.join(", ")} }`);
    }
    lines.push("");
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push(`### Warnings`);
    for (const warning of warnings) {
      lines.push(warning);
    }
    lines.push("");
  }

  // Instructions for LLM
  lines.push(`### Instructions`);
  if (impactLevel === "critical" || impactLevel === "high") {
    lines.push(`- **IMPORTANT:** This change has ${impactLevel} impact`);
    lines.push(`- Check all dependent files for compatibility`);
    lines.push(`- Preserve function/method signatures if possible`);
    lines.push(`- If signatures must change, note which files need updates`);
  } else {
    lines.push(`- Impact is ${impactLevel} - proceed with normal care`);
  }

  return lines.join("\n");
}
