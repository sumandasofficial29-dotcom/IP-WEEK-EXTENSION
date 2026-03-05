import * as fs from "fs";
import * as path from "path";

export class DependencyAnalyzer {
  analyze(root: string): Record<string, string> {
    const pkgPath = path.join(root, "package.json");
    if (!fs.existsSync(pkgPath)) return {};

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      return {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
    } catch {
      return {};
    }
  }
}
