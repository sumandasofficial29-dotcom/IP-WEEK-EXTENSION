import { RepoScanResult } from "./repoScanner";

export class ContextCompressor {
  compress(scan: RepoScanResult): string {
    const i = scan.insights;

    return `
PROJECT ROOT:
${scan.projectRoot}

FRAMEWORK DETECTION:
Angular: ${i.hasAngular ? "Yes" : "No"}
React: ${i.hasReact ? "Yes" : "No"}

ARCHITECTURE INSIGHTS:
SCSS Usage: ${i.hasSCSS ? "Yes" : "No"}
Routing Module: ${i.hasRouting ? "Detected" : "Not detected"}
State Management: ${i.hasStateManagement ? "Detected" : "Not detected"}
UI Library: ${i.hasAngularMaterial ? "Angular Material" : "Not detected"}
Testing Framework: ${i.testFramework || "Unknown"}

DEPENDENCIES:
${Object.keys(scan.dependencies).slice(0, 15).join(", ")}

FILE STRUCTURE SNAPSHOT:
${scan.fileTree.slice(0, 30).join("\n")}
`.trim();
  }
}
