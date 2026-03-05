import * as fs from "fs";
import * as path from "path";

export class FilePatternAnalyzer {
  detectAngular(root: string): boolean {
    return fs.existsSync(path.join(root, "angular.json"));
  }

  detectReact(root: string): boolean {
    return fs.existsSync(path.join(root, "vite.config.ts")) ||
           fs.existsSync(path.join(root, "src", "App.tsx"));
  }

  detectMonorepo(root: string): boolean {
    return fs.existsSync(path.join(root, "workspace.json")) ||
           fs.existsSync(path.join(root, "nx.json"));
  }
}
