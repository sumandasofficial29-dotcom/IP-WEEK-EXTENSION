"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPatterns = detectPatterns;
exports.detectStyling = detectStyling;
exports.detectStateManagement = detectStateManagement;
exports.detectRouting = detectRouting;
exports.detectAPIStyle = detectAPIStyle;
exports.analyzeArchitecture = analyzeArchitecture;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const detectorContext_1 = require("./detectorContext");
const frameworkConstants_1 = require("./frameworkConstants");
const cppDetector_1 = require("./cppDetector");
/**
 * Folder patterns for architecture detection
 */
const FOLDER_PATTERNS = {
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
function hasDirectory(rootPath, name) {
    const paths = [path.join(rootPath, name), path.join(rootPath, "src", name)];
    return paths.some((p) => {
        try {
            return fs.existsSync(p) && fs.statSync(p).isDirectory();
        }
        catch {
            return false;
        }
    });
}
/**
 * Detect architectural patterns
 */
function detectPatterns(context) {
    const patterns = [];
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
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.(component|tsx|vue|svelte)\./)) {
        if (!patterns.includes("Component-Based Architecture")) {
            patterns.push("Component-Based Architecture");
        }
    }
    // Service layer for TS/JS
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.service\.(ts|js)$/)) {
        if (!patterns.includes("Service Layer Pattern")) {
            patterns.push("Service Layer Pattern");
        }
    }
    // Module-based
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.module\.(ts|js)$/)) {
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
    if (fs.existsSync(path.join(context.rootPath, "nx.json")) ||
        fs.existsSync(path.join(context.rootPath, "turbo.json")) ||
        fs.existsSync(path.join(context.rootPath, "lerna.json"))) {
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
function detectStyling(context) {
    const result = {};
    // Check preprocessors from file extensions
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.scss$/))
        result.preprocessor = "SCSS";
    else if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.less$/))
        result.preprocessor = "LESS";
    else if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.styl$/))
        result.preprocessor = "Stylus";
    // Check UI frameworks from package.json
    for (const [name, packages] of Object.entries(frameworkConstants_1.STYLING_LIBS)) {
        if (packages.length > 0 && packages.some((p) => context.allDeps.includes(p))) {
            if ([
                "TailwindCSS",
                "Bootstrap",
                "Material UI",
                "Angular Material",
                "Chakra UI",
                "Ant Design",
                "PrimeNG",
                "PrimeReact"
            ].includes(name)) {
                result.framework = name;
            }
            else if (!["SCSS", "LESS", "Stylus"].includes(name)) {
                result.methodology = name;
            }
        }
    }
    // CSS Modules detection
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.module\.(css|scss)$/)) {
        result.methodology = "CSS Modules";
    }
    return result;
}
/**
 * Detect state management
 */
function detectStateManagement(context) {
    for (const [name, packages] of Object.entries(frameworkConstants_1.STATE_LIBRARIES)) {
        if (packages.some((p) => context.allDeps.includes(p))) {
            const pattern = name.includes("Redux") || name.includes("NgRx") || name.includes("NGXS")
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
function detectRouting(context) {
    const routes = [];
    let type;
    if (context.allDeps.includes("@angular/router")) {
        type = "Angular Router";
    }
    else if (context.allDeps.includes("react-router-dom") ||
        context.allDeps.includes("react-router")) {
        type = "React Router";
    }
    else if (context.allDeps.includes("vue-router")) {
        type = "Vue Router";
    }
    else if (context.allDeps.includes("next")) {
        type = "File-based Routing (Next.js)";
    }
    else if (context.allDeps.includes("nuxt")) {
        type = "File-based Routing (Nuxt)";
    }
    return { type, routes };
}
/**
 * Detect API style and client
 */
function detectAPIStyle(context) {
    let client;
    let style = "REST";
    if (context.allDeps.includes("axios"))
        client = "Axios";
    else if (context.allDeps.includes("@angular/common"))
        client = "Angular HttpClient";
    else if (context.allDeps.includes("@tanstack/react-query"))
        client = "TanStack Query";
    else if (context.allDeps.includes("swr"))
        client = "SWR";
    else if (context.allDeps.includes("got"))
        client = "Got";
    if (context.allDeps.some((d) => d.includes("graphql") || d.includes("apollo"))) {
        style = "GraphQL";
    }
    else if (context.allDeps.some((d) => d.includes("trpc"))) {
        style = "tRPC";
    }
    else if (context.allDeps.some((d) => d.includes("grpc")) ||
        (0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.proto$/)) {
        style = "gRPC/Protobuf";
    }
    return { client, style };
}
/**
 * Main architecture analyzer
 */
function analyzeArchitecture(context) {
    const arch = {
        patterns: detectPatterns(context),
        styling: detectStyling(context),
        testing: { framework: undefined, e2e: undefined, coverage: undefined }, // Will be set by testing detector
        stateManagement: detectStateManagement(context),
        routing: detectRouting(context),
        api: detectAPIStyle(context),
        build: { bundler: undefined, transpiler: undefined, buildSystem: undefined } // Will be set by build detector
    };
    // Add C++ BMS/MDW architecture info if detected
    if ((0, detectorContext_1.hasLanguageFiles)(context, [".cpp", ".cc", ".cxx", ".hpp", ".h"])) {
        const cppBmsDetector = new cppDetector_1.CppBMSDetector(context.rootPath);
        const bms = cppBmsDetector.detect();
        if (bms.isBms && bms.bmsInfo) {
            arch.bms = bms.bmsInfo;
        }
    }
    return arch;
}
//# sourceMappingURL=architectureDetector.js.map