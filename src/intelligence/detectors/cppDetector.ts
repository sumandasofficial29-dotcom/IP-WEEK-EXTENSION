import * as fs from "fs";
import * as path from "path";
import { CppBMSResult } from "./detectorTypes";

/**
 * Detects C++ BMS/MDW project characteristics
 */
export class CppBMSDetector {
  constructor(private rootPath: string) {}

  detect(): CppBMSResult {
    const result: CppBMSResult = { isBms: false, indicators: [], bmsInfo: undefined };
    
    // Check for BMS signature files
    const hasForest = fs.existsSync(path.join(this.rootPath, "Forest.xml"));
    const hasBmsrc = fs.existsSync(path.join(this.rootPath, "bmsrc"));
    const hasCmk = fs.existsSync(path.join(this.rootPath, "cmk"));
    
    if (!hasForest && !hasBmsrc) {
      return result;
    }

    result.isBms = true;
    const bmsInfo = {
      modules: [] as string[],
      designPatterns: [] as string[],
      middlewarePatterns: [] as string[],
      middlewareVersion: undefined as string | undefined,
      cppStandard: undefined as string | undefined,
      bmsDependencies: [] as string[],
      submodules: [] as string[]
    };

    // Parse Forest.xml
    if (hasForest) {
      result.indicators.push("Forest.xml");
      try {
        const content = fs.readFileSync(path.join(this.rootPath, "Forest.xml"), "utf-8");
        const moduleMatches = content.matchAll(/<component\s+name="([^"]+)"/g);
        for (const match of moduleMatches) {
          bmsInfo.modules.push(match[1]);
        }
        const mdwMatch = content.match(/<mdw[^>]*version="([^"]+)"/);
        if (mdwMatch) {
          bmsInfo.middlewareVersion = `MDW ${mdwMatch[1]}`;
        }
        const depMatches = Array.from(content.matchAll(/ar:\/\/([^"]+)/g));
        bmsInfo.bmsDependencies = depMatches.map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);
      } catch {}
    }

    // Parse bmsrc
    if (hasBmsrc) {
      result.indicators.push("bmsrc");
      try {
        const content = fs.readFileSync(path.join(this.rootPath, "bmsrc"), "utf-8");
        const mwpackMatch = content.match(/MWPACK_VER[=\s]+(\d+)/);
        if (mwpackMatch) {
          bmsInfo.middlewareVersion = bmsInfo.middlewareVersion || `MDW Pack ${mwpackMatch[1]}`;
        }
        const cppStdMatch = content.match(/-std=c\+\+(\d+)/);
        if (cppStdMatch) {
          bmsInfo.cppStandard = `C++${cppStdMatch[1]}`;
        }
        const arMatches = Array.from(content.matchAll(/ar:\/\/([^\s"']+)/g));
        arMatches.forEach(m => {
          if (!bmsInfo.bmsDependencies.includes(m[1])) {
            bmsInfo.bmsDependencies.push(m[1]);
          }
        });
      } catch {}
    }

    // Check for CMK service topology
    if (hasCmk) {
      result.indicators.push("CMK topology");
      bmsInfo.middlewarePatterns.push("CMK Service Topology");
    }

    // Parse .gitmodules
    const gitmodulesPath = path.join(this.rootPath, ".gitmodules");
    if (fs.existsSync(gitmodulesPath)) {
      try {
        const content = fs.readFileSync(gitmodulesPath, "utf-8");
        const pathMatches = content.matchAll(/path\s*=\s*(.+)/g);
        for (const match of pathMatches) {
          bmsInfo.submodules.push(match[1].trim());
        }
      } catch {}
    }

    // Detect C++ standard from other sources
    if (!bmsInfo.cppStandard) {
      const copilotPath = path.join(this.rootPath, ".github", "copilot-instructions.md");
      if (fs.existsSync(copilotPath)) {
        try {
          const content = fs.readFileSync(copilotPath, "utf-8");
          const cppMatch = content.match(/C\+\+(\d+)/i);
          if (cppMatch) bmsInfo.cppStandard = `C++${cppMatch[1]}`;
        } catch {}
      }
    }

    // Detect modules from src/ structure
    const srcPath = path.join(this.rootPath, "src");
    if (fs.existsSync(srcPath)) {
      try {
        const entries = fs.readdirSync(srcPath, { withFileTypes: true });
        entries.forEach(entry => {
          if (entry.isDirectory() && !bmsInfo.modules.includes(entry.name)) {
            bmsInfo.modules.push(entry.name);
          }
        });
      } catch {}
    }

    // Detect design and middleware patterns
    const patternDirs = ["factory", "command", "adapter", "proxy", "manager", "pimpl", "mock", 
                        "bladaptor", "msiadaptor", "msgencoder", "entry", "svc", "bom", "DBLayer"];
    const patternMap: Record<string, string> = {
      "factory": "Factory Pattern",
      "command": "Command Pattern",
      "adapter": "Adapter Pattern",
      "proxy": "Proxy Pattern",
      "manager": "Manager/Facade",
      "pimpl": "PIMPL",
      "mock": "Mock Object",
      "bladaptor": "Message Adapter",
      "msiadaptor": "Message Adapter",
      "msgencoder": "Message Encoding Pipeline",
      "entry": "Entry Point/Dispatcher",
      "svc": "Service Layer",
      "bom": "BOM (Business Object Model)",
      "DBLayer": "Database Layer"
    };

    this.walkFiles((filePath) => {
      const pathLower = filePath.toLowerCase();
      patternDirs.forEach(dir => {
        if (pathLower.includes(dir)) {
          const pattern = patternMap[dir];
          if (pattern.includes("Message") || pattern.includes("Service") || pattern.includes("Entry") || pattern.includes("BOM") || pattern.includes("Database")) {
            if (!bmsInfo.middlewarePatterns.includes(pattern)) {
              bmsInfo.middlewarePatterns.push(pattern);
            }
          } else {
            if (!bmsInfo.designPatterns.includes(pattern)) {
              bmsInfo.designPatterns.push(pattern);
            }
          }
        }
      });
      
      // Check for specific file patterns
      if (/Fac\w+\.(cpp|hpp)/.test(filePath) && !bmsInfo.designPatterns.includes("Factory Pattern")) {
        bmsInfo.designPatterns.push("Factory Pattern");
      }
      if (/Cmd\w+\.(cpp|hpp)/.test(filePath) && !bmsInfo.designPatterns.includes("Command Pattern")) {
        bmsInfo.designPatterns.push("Command Pattern");
      }
      if (/Abstract\w+\.(cpp|hpp)/.test(filePath) && !bmsInfo.designPatterns.includes("Abstract/Template Method")) {
        bmsInfo.designPatterns.push("Abstract/Template Method");
      }
    }, 3);

    // Detect test framework
    const testDirs = ["test", "tests", "regression"];
    for (const dir of testDirs) {
      const testPath = path.join(this.rootPath, dir);
      if (fs.existsSync(testPath)) {
        result.indicators.push(`${dir}/ directory`);
        break;
      }
    }

    result.bmsInfo = bmsInfo;
    
    if (bmsInfo.modules.length > 0) {
      result.indicators.push(`${bmsInfo.modules.length} modules`);
    }
    if (bmsInfo.designPatterns.length > 0) {
      result.indicators.push(`${bmsInfo.designPatterns.length} design patterns`);
    }

    return result;
  }

  private walkFiles(callback: (filePath: string) => void, maxDepth: number = 6, dir?: string, depth: number = 0): void {
    if (depth >= maxDepth) return;
    const currentDir = dir || this.rootPath;

    try {
      const entries = fs.readdirSync(currentDir);
      for (const entry of entries) {
        // Skip hidden folders and common non-source directories
        if (entry.startsWith(".") || 
            ["node_modules", "dist", "build", "coverage", ".git", "vendor", "__pycache__", 
             "target", "bin", "obj", ".vs", ".idea"].includes(entry)) {
          continue;
        }
        const fullPath = path.join(currentDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            this.walkFiles(callback, maxDepth, fullPath, depth + 1);
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
}
