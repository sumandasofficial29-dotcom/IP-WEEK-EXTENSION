import * as fs from "fs";
import * as path from "path";
import { ProjectRootDetector } from "./projectRootDetector";
import { DependencyAnalyzer } from "./dependencyAnalyzer";
import { DeepRepoAnalyzer, DeepRepoInsights } from "./deepRepoAnalyzer";
import { extractClasses } from "./ast/symbolIndexer";
import { ClassInfo, RepoStructure } from "./ast/types";
import { buildDependencyGraph, DependencyNode } from "./ast/dependencyGraphBuilder";
import { buildCompactStructure } from "./fileStructureBuilder";
import { cacheManager } from "./cacheManager";

export interface RepoScanResult {
  projectRoot: string;
  dependencies: Record<string, string>;
  insights: DeepRepoInsights;
  fileTree: string;
  isAngular: boolean;
  isReact: boolean;
  structure: RepoStructure;
  dependencyGraph: DependencyNode[];
}

export class RepoScanner {
  private rootDetector = new ProjectRootDetector();
  private depAnalyzer = new DependencyAnalyzer();
  private deepAnalyzer = new DeepRepoAnalyzer();

  async scan(workspaceRoot: string): Promise<RepoScanResult> {
    const scanStart = Date.now();
    const projectRoot = this.rootDetector.detect(workspaceRoot);

    // Check cache for repo structure
    const cachedStructure = cacheManager.getRepoStructure(projectRoot);
    let fileTree: string;
    let tsFiles: string[];
    let usedCache = false;

    if (cachedStructure && cachedStructure.fileList) {
      // Use cached data
      console.log('[PromptCraft] Using cached repo structure');
      fileTree = cachedStructure.folderTree;
      tsFiles = cachedStructure.fileList;
      usedCache = true;
    } else {
      // Scan fresh and cache
      console.log('[PromptCraft] Scanning repo structure (fresh)');
      
      fileTree = buildCompactStructure(projectRoot);
      tsFiles = this.collectTsFiles(projectRoot);
      
      // Cache the structure
      cacheManager.setRepoStructure(projectRoot, {
        fileCount: tsFiles.length,
        folderTree: fileTree,
        fileList: tsFiles,
        scanDepth: 6
      });
    }

    const dependencies = this.depAnalyzer.analyze(projectRoot);
    const insights = this.deepAnalyzer.analyze(projectRoot);
    const structure = this.buildStructure(tsFiles);
    const dependencyGraph = buildDependencyGraph(tsFiles);

    // Record total scan time
    const scanDuration = Date.now() - scanStart;
    cacheManager.recordScanTime(scanDuration, usedCache);
    console.log(`[PromptCraft] Scan completed in ${scanDuration}ms ${usedCache ? '(cached)' : '(fresh)'}`);

    return {
      projectRoot,
      dependencies,
      insights,
      fileTree,
      isAngular: insights.hasAngular,
      isReact: insights.hasReact,
      structure,
      dependencyGraph
    };
  }

  private collectTsFiles(dir: string, files: string[] = []): string[] {
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return files;
    }

    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;

      const fullPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          this.collectTsFiles(fullPath, files);
        } else if (entry.endsWith(".ts") && !entry.endsWith(".spec.ts") && !entry.endsWith(".d.ts")) {
          files.push(fullPath);
        }
      } catch {
        // skip inaccessible files
      }
    }

    return files;
  }

  private buildStructure(tsFiles: string[]): RepoStructure {
    const allClasses: ClassInfo[] = [];

    for (const file of tsFiles) {
      const classes = extractClasses(file);
      allClasses.push(...classes);
    }

    const services = allClasses.filter(c =>
      c.decorators.some(d => d.includes("Injectable"))
    );

    const components = allClasses.filter(c =>
      c.decorators.some(d => d.includes("Component"))
    );

    const utils = allClasses.filter(c =>
      c.decorators.length === 0 && c.filePath.includes("util")
    );

    return {
      classes: allClasses,
      services,
      components,
      utils
    };
  }
}
