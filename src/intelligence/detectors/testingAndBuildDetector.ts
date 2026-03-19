import * as fs from "fs";
import * as path from "path";
import { DetectorContext, hasFilesMatching } from "./detectorContext";
import { BUILD_TOOLS, TEST_FRAMEWORKS } from "./frameworkConstants";
import { TESTING_FRAMEWORKS, BUILD_SYSTEM_SIGNATURES } from "./buildSystemConstants";

function hasDirectory(rootPath: string, name: string): boolean {
  const paths = [path.join(rootPath, name), path.join(rootPath, "src", name)];
  return paths.some((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Detect testing frameworks
 */
export function detectTesting(context: DetectorContext): {
  framework?: string;
  e2e?: string;
  coverage?: string;
} {
  const result: { framework?: string; e2e?: string; coverage?: string } = {};
  const detected: string[] = [];

  // Check for test frameworks from files and patterns
  for (const [name, config] of Object.entries(TESTING_FRAMEWORKS)) {
    // Check files
    for (const filePattern of config.files) {
      if (filePattern.includes("*")) {
        const ext = filePattern.replace("*", "");
        if (hasFilesMatching(context.rootPath, new RegExp(`\\${ext}$`))) {
          detected.push(name);
          break;
        }
      } else if (fs.existsSync(path.join(context.rootPath, filePattern))) {
        detected.push(name);
        break;
      }
    }

    // Check patterns
    for (const pattern of config.patterns) {
      if (hasFilesMatching(context.rootPath, pattern)) {
        if (!detected.includes(name)) {
          detected.push(name);
        }
        break;
      }
    }
  }

  // Also check package.json for JS test frameworks
  for (const [name, sig] of Object.entries(TEST_FRAMEWORKS)) {
    const hasPackage = sig.packages.some((p) => context.allDeps.includes(p));
    const hasConfig = sig.configs.some((c) =>
      fs.existsSync(path.join(context.rootPath, c))
    );

    if (hasPackage || hasConfig) {
      if (!detected.includes(name)) {
        detected.push(name);
      }
    }
  }

  // Categorize
  for (const name of detected) {
    if (["Cypress", "Playwright", "Puppeteer"].includes(name)) {
      result.e2e = result.e2e || name;
    } else if (!result.framework) {
      result.framework = name;
    }
  }

  // Update context
  context.detectedTestFrameworks = detected;

  // Coverage tools
  if (context.allDeps.includes("nyc") || context.allDeps.includes("c8")) {
    result.coverage = "Istanbul/NYC";
  }
  if (detected.includes("pytest")) {
    result.coverage = "pytest-cov";
  }

  return result;
}

/**
 * Detect build systems from files
 */
export function detectBuildSystemsFromFiles(context: DetectorContext): string[] {
  const detected: string[] = [];

  for (const [name, sig] of Object.entries(BUILD_SYSTEM_SIGNATURES)) {
    for (const filePattern of sig.files) {
      // Handle glob patterns
      const cleanPattern = filePattern.replace(/\*\*/g, "").replace(/\*/g, "");

      if (cleanPattern.includes("/")) {
        // Directory pattern
        const dir = cleanPattern.split("/")[0];
        if (hasDirectory(context.rootPath, dir)) {
          detected.push(name);
          break;
        }
      } else if (cleanPattern.startsWith(".")) {
        // Extension pattern
        const ext = cleanPattern;
        if (hasFilesMatching(context.rootPath, new RegExp(`\\${ext}$`))) {
          detected.push(name);
          break;
        }
      } else {
        // Exact file
        if (fs.existsSync(path.join(context.rootPath, filePattern))) {
          detected.push(name);
          break;
        }
      }
    }
  }

  // Update context
  context.detectedBuildSystems = detected;
  return detected;
}

/**
 * Detect build tools (bundlers, transpilers, build systems)
 */
export function detectBuildTools(context: DetectorContext): {
  bundler?: string;
  transpiler?: string;
  buildSystem?: string;
} {
  const result: { bundler?: string; transpiler?: string; buildSystem?: string } = {};

  // Detect build systems
  const buildSystems = detectBuildSystemsFromFiles(context);
  if (buildSystems.length > 0) {
    result.buildSystem = buildSystems.join(", ");
  }

  // JS/TS bundlers
  for (const [name, sig] of Object.entries(BUILD_TOOLS)) {
    const hasPackage = sig.packages.some((p) => context.allDeps.includes(p));
    const hasConfig = sig.configs.some((c) => fs.existsSync(path.join(context.rootPath, c)));

    if ((hasPackage || hasConfig) && !result.bundler) {
      result.bundler = name;
    }
  }

  // Transpiler
  if (
    context.allDeps.includes("typescript") ||
    fs.existsSync(path.join(context.rootPath, "tsconfig.json"))
  ) {
    result.transpiler = "TypeScript";
  } else if (context.allDeps.includes("@babel/core")) {
    result.transpiler = "Babel";
  } else if (context.allDeps.includes("@swc/core")) {
    result.transpiler = "SWC";
  }

  return result;
}
