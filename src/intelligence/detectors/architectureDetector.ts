import * as fs from "fs";
import * as path from "path";
import { ArchitectureInfo } from "./detectorTypes";
import { DetectorContext, hasFilesMatching, hasLanguageFiles } from "./detectorContext";
import { STATE_LIBRARIES, STYLING_LIBS } from "./frameworkConstants";
import { CppBMSDetector } from "./cppDetector";

/**
 * Folder patterns for architecture detection
 */
const FOLDER_PATTERNS: Record<string, { folders: string[]; pattern: string }> = {
  Microservices: {
    folders: ["services/**", "microservices/**", "apps/**"],
    pattern: "Microservices Architecture"
  },
  MVC: {
    folders: ["controllers", "models", "views"],
    pattern: "MVC Architecture"
  },
  "Clean Architecture": {
    folders: ["domain", "application", "infrastructure", "presentation"],
    pattern: "Clean Architecture"
  },
  Hexagonal: {
    folders: ["adapters", "ports", "core"],
    pattern: "Hexagonal Architecture"
  },
  DDD: {
    folders: ["domain", "aggregates", "entities", "repositories", "value-objects"],
    pattern: "Domain-Driven Design"
  },
  Layered: {
    folders: ["dal", "bll", "ui", "dba", "svc"],
    pattern: "Layered Architecture"
  },
  "Feature-based": {
    folders: ["features/**", "modules/**"],
    pattern: "Feature-based Architecture"
  },
  "Component-based": {
    folders: ["components/**", "widgets/**"],
    pattern: "Component-based Architecture"
  },
  "API Layer": {
    folders: ["api", "json_api", "rest", "graphql"],
    pattern: "API Layer Pattern"
  },
  "BOM Pattern": {
    folders: ["bom", "bom2", "bommanager"],
    pattern: "Business Object Model"
  }
};

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
 * Detect architectural patterns
 */
export function detectPatterns(context: DetectorContext): string[] {
  const patterns: string[] = [];

  // Detect from folder structure
  for (const [, config] of Object.entries(FOLDER_PATTERNS)) {
    for (const folder of config.folders) {
      const cleanFolder = folder.replace(/\*\*/g, "").replace(/\//g, "");
      if (hasDirectory(context.rootPath, cleanFolder)) {
        if (!patterns.includes(config.pattern)) {
          patterns.push(config.pattern);
        }
        break;
      }
    }
  }

  // Component-based
  if (hasFilesMatching(context.rootPath, /\.(component|tsx|vue|svelte)\./)) {
    if (!patterns.includes("Component-Based Architecture")) {
      patterns.push("Component-Based Architecture");
    }
  }

  // Service layer for TS/JS
  if (hasFilesMatching(context.rootPath, /\.service\.(ts|js)$/)) {
    if (!patterns.includes("Service Layer Pattern")) {
      patterns.push("Service Layer Pattern");
    }
  }

  // Module-based
  if (hasFilesMatching(context.rootPath, /\.module\.(ts|js)$/)) {
    patterns.push("Feature Modules");
  }

  // Reactive
  if (context.allDeps.includes("rxjs")) {
    patterns.push("Reactive Programming (RxJS)");
  }

  // GraphQL
  if (context.allDeps.some((d) => d.includes("graphql") || d.includes("apollo"))) {
    patterns.push("GraphQL API");
  }

  // Monorepo
  if (
    fs.existsSync(path.join(context.rootPath, "nx.json")) ||
    fs.existsSync(path.join(context.rootPath, "turbo.json")) ||
    fs.existsSync(path.join(context.rootPath, "lerna.json"))
  ) {
    patterns.push("Monorepo");
  }

  // Enterprise patterns from folder structure
  if (hasDirectory(context.rootPath, "cmk") || hasDirectory(context.rootPath, ".cmk")) {
    patterns.push("CMK Deployment");
  }
  if (hasDirectory(context.rootPath, ".bms")) {
    patterns.push("BMS Build System");
  }
  if (hasDirectory(context.rootPath, ".devcontainer")) {
    patterns.push("Dev Container Support");
  }
  if (hasDirectory(context.rootPath, ".github")) {
    patterns.push("GitHub Workflows");
  }

  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Detect styling technologies
 */
export function detectStyling(context: DetectorContext): {
  preprocessor?: string;
  framework?: string;
  methodology?: string;
} {
  const result: { preprocessor?: string; framework?: string; methodology?: string } = {};

  // Check preprocessors from file extensions
  if (hasFilesMatching(context.rootPath, /\.scss$/)) result.preprocessor = "SCSS";
  else if (hasFilesMatching(context.rootPath, /\.less$/)) result.preprocessor = "LESS";
  else if (hasFilesMatching(context.rootPath, /\.styl$/)) result.preprocessor = "Stylus";

  // Check UI frameworks from package.json
  for (const [name, packages] of Object.entries(STYLING_LIBS)) {
    if (packages.length > 0 && packages.some((p) => context.allDeps.includes(p))) {
      if (
        [
          "TailwindCSS",
          "Bootstrap",
          "Material UI",
          "Angular Material",
          "Chakra UI",
          "Ant Design",
          "PrimeNG",
          "PrimeReact"
        ].includes(name)
      ) {
        result.framework = name;
      } else if (!["SCSS", "LESS", "Stylus"].includes(name)) {
        result.methodology = name;
      }
    }
  }

  // CSS Modules detection
  if (hasFilesMatching(context.rootPath, /\.module\.(css|scss)$/)) {
    result.methodology = "CSS Modules";
  }

  return result;
}

/**
 * Detect state management
 */
export function detectStateManagement(context: DetectorContext): {
  library?: string;
  pattern?: string;
} {
  for (const [name, packages] of Object.entries(STATE_LIBRARIES)) {
    if (packages.some((p) => context.allDeps.includes(p))) {
      const pattern =
        name.includes("Redux") || name.includes("NgRx") || name.includes("NGXS")
          ? "Flux/Redux Pattern"
          : name === "MobX"
            ? "Observable Pattern"
            : "Atomic State";

      return { library: name, pattern };
    }
  }
  return {};
}

/**
 * Detect routing settings
 */
export function detectRouting(context: DetectorContext): { type?: string; routes: string[] } {
  const routes: string[] = [];
  let type: string | undefined;

  if (context.allDeps.includes("@angular/router")) {
    type = "Angular Router";
  } else if (
    context.allDeps.includes("react-router-dom") ||
    context.allDeps.includes("react-router")
  ) {
    type = "React Router";
  } else if (context.allDeps.includes("vue-router")) {
    type = "Vue Router";
  } else if (context.allDeps.includes("next")) {
    type = "File-based Routing (Next.js)";
  } else if (context.allDeps.includes("nuxt")) {
    type = "File-based Routing (Nuxt)";
  }

  return { type, routes };
}

/**
 * Detect API style and client
 */
export function detectAPIStyle(context: DetectorContext): { client?: string; style?: string } {
  let client: string | undefined;
  let style = "REST";

  if (context.allDeps.includes("axios")) client = "Axios";
  else if (context.allDeps.includes("@angular/common")) client = "Angular HttpClient";
  else if (context.allDeps.includes("@tanstack/react-query")) client = "TanStack Query";
  else if (context.allDeps.includes("swr")) client = "SWR";
  else if (context.allDeps.includes("got")) client = "Got";

  if (context.allDeps.some((d) => d.includes("graphql") || d.includes("apollo"))) {
    style = "GraphQL";
  } else if (context.allDeps.some((d) => d.includes("trpc"))) {
    style = "tRPC";
  } else if (
    context.allDeps.some((d) => d.includes("grpc")) ||
    hasFilesMatching(context.rootPath, /\.proto$/)
  ) {
    style = "gRPC/Protobuf";
  }

  return { client, style };
}

/**
 * Main architecture analyzer
 */
export function analyzeArchitecture(context: DetectorContext): ArchitectureInfo {
  const arch: ArchitectureInfo = {
    patterns: detectPatterns(context),
    styling: detectStyling(context),
    testing: { framework: undefined, e2e: undefined, coverage: undefined }, // Will be set by testing detector
    stateManagement: detectStateManagement(context),
    routing: detectRouting(context),
    api: detectAPIStyle(context),
    build: { bundler: undefined, transpiler: undefined, buildSystem: undefined } // Will be set by build detector
  };

  // Add C++ BMS/MDW architecture info if detected
  if (hasLanguageFiles(context, [".cpp", ".cc", ".cxx", ".hpp", ".h"])) {
    const cppBmsDetector = new CppBMSDetector(context.rootPath);
    const bms = cppBmsDetector.detect();
    if (bms.isBms && bms.bmsInfo) {
      arch.bms = bms.bmsInfo;
    }
  }

  return arch;
}
