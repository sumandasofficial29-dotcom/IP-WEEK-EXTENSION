import * as fs from "fs";
import * as path from "path";

export class ProjectRootDetector {
  detect(workspaceRoot: string): string {
    const candidates: string[] = [];

    const walk = (dir: string, depth: number) => {
      if (depth > 3) return;

      let entries: string[];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        return;
      }

      if (entries.includes("angular.json") ||
          entries.includes("package.json") ||
          entries.includes("next.config.js") ||
          entries.includes("vite.config.ts")) {
        candidates.push(dir);
      }

      for (const entry of entries) {
        const full = path.join(dir, entry);
        try {
          if (
            fs.statSync(full).isDirectory() &&
            !entry.startsWith(".") &&
            entry !== "node_modules" &&
            entry !== "dist"
          ) {
            walk(full, depth + 1);
          }
        } catch {
          continue;
        }
      }
    };

    walk(workspaceRoot, 0);

    if (candidates.length === 0) return workspaceRoot;

    // Prefer deeper folders (likely actual app)
    candidates.sort((a, b) => b.length - a.length);

    return candidates[0];
  }
}
