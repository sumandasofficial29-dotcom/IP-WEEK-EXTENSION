import * as fs from "fs";
import * as path from "path";

export interface DeepRepoInsights {
  hasAngular: boolean;
  hasReact: boolean;
  hasSCSS: boolean;
  hasRouting: boolean;
  hasStateManagement: boolean;
  hasAngularMaterial: boolean;
  testFramework?: string;
}

export class DeepRepoAnalyzer {
  analyze(root: string): DeepRepoInsights {
    let files: string[];
    try {
      files = fs.readdirSync(root);
    } catch {
      return {
        hasAngular: false,
        hasReact: false,
        hasSCSS: false,
        hasRouting: false,
        hasStateManagement: false,
        hasAngularMaterial: false
      };
    }

    const hasAngular = files.includes("angular.json");
    const hasReact = files.includes("vite.config.ts") ||
                     files.includes("next.config.js") ||
                     files.includes("next.config.mjs");

    // Check for Angular Material in package.json
    const packageJsonPath = path.join(root, "package.json");
    let hasAngularMaterial = false;

    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        hasAngularMaterial = pkg.dependencies?.["@angular/material"] !== undefined;
      } catch {
        // Ignore parsing errors
      }
    }

    const srcPath = path.join(root, "src");

    let hasSCSS = false;
    let hasRouting = false;
    let hasState = false;

    if (fs.existsSync(srcPath)) {
      const walk = (dir: string) => {
        let entries: string[];
        try {
          entries = fs.readdirSync(dir);
        } catch {
          return;
        }

        for (const file of entries) {
          const full = path.join(dir, file);

          try {
            if (fs.statSync(full).isDirectory()) {
              walk(full);
            } else {
              if (file.endsWith(".scss")) hasSCSS = true;
              if (file.includes("routing")) hasRouting = true;
              if (file.includes("store") || file.includes("state"))
                hasState = true;
            }
          } catch {
            continue;
          }
        }
      };
      walk(srcPath);
    }

    return {
      hasAngular,
      hasReact,
      hasSCSS,
      hasRouting,
      hasStateManagement: hasState,
      hasAngularMaterial,
      testFramework: files.includes("karma.conf.js")
        ? "Karma"
        : files.includes("jest.config.js") || files.includes("jest.config.ts")
        ? "Jest"
        : undefined
    };
  }
}
