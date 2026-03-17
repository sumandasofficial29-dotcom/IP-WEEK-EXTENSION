import * as fs from "fs";
import * as path from "path";
import { ProjectRootDetector } from "./projectRootDetector";
import { DependencyAnalyzer } from "./dependencyAnalyzer";
import { DeepRepoAnalyzer, DeepRepoInsights } from "./deepRepoAnalyzer";
import { extractClasses } from "./ast/symbolIndexer";
import { ClassInfo, RepoStructure } from "./ast/types";
import { buildDependencyGraph, DependencyNode } from "./ast/dependencyGraphBuilder";
import { buildCompactStructure } from "./fileStructureBuilder";

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
    const projectRoot = this.rootDetector.detect(workspaceRoot);

    const dependencies = this.depAnalyzer.analyze(projectRoot);
    const insights = this.deepAnalyzer.analyze(projectRoot);
    const tsFiles = this.collectTsFiles(projectRoot);
    const structure = this.buildStructure(tsFiles);
    const dependencyGraph = buildDependencyGraph(tsFiles);

    return {
      projectRoot,
      dependencies,
      insights,
      fileTree: buildCompactStructure(projectRoot),
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
