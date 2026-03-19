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
exports.detectTesting = detectTesting;
exports.detectBuildSystemsFromFiles = detectBuildSystemsFromFiles;
exports.detectBuildTools = detectBuildTools;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const detectorContext_1 = require("./detectorContext");
const frameworkConstants_1 = require("./frameworkConstants");
const buildSystemConstants_1 = require("./buildSystemConstants");
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
 * Detect testing frameworks
 */
function detectTesting(context) {
    const result = {};
    const detected = [];
    // Check for test frameworks from files and patterns
    for (const [name, config] of Object.entries(buildSystemConstants_1.TESTING_FRAMEWORKS)) {
        // Check files
        for (const filePattern of config.files) {
            if (filePattern.includes("*")) {
                const ext = filePattern.replace("*", "");
                if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, new RegExp(`\\${ext}$`))) {
                    detected.push(name);
                    break;
                }
            }
            else if (fs.existsSync(path.join(context.rootPath, filePattern))) {
                detected.push(name);
                break;
            }
        }
        // Check patterns
        for (const pattern of config.patterns) {
            if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, pattern)) {
                if (!detected.includes(name)) {
                    detected.push(name);
                }
                break;
            }
        }
    }
    // Also check package.json for JS test frameworks
    for (const [name, sig] of Object.entries(frameworkConstants_1.TEST_FRAMEWORKS)) {
        const hasPackage = sig.packages.some((p) => context.allDeps.includes(p));
        const hasConfig = sig.configs.some((c) => fs.existsSync(path.join(context.rootPath, c)));
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
        }
        else if (!result.framework) {
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
function detectBuildSystemsFromFiles(context) {
    const detected = [];
    for (const [name, sig] of Object.entries(buildSystemConstants_1.BUILD_SYSTEM_SIGNATURES)) {
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
            }
            else if (cleanPattern.startsWith(".")) {
                // Extension pattern
                const ext = cleanPattern;
                if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, new RegExp(`\\${ext}$`))) {
                    detected.push(name);
                    break;
                }
            }
            else {
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
function detectBuildTools(context) {
    const result = {};
    // Detect build systems
    const buildSystems = detectBuildSystemsFromFiles(context);
    if (buildSystems.length > 0) {
        result.buildSystem = buildSystems.join(", ");
    }
    // JS/TS bundlers
    for (const [name, sig] of Object.entries(frameworkConstants_1.BUILD_TOOLS)) {
        const hasPackage = sig.packages.some((p) => context.allDeps.includes(p));
        const hasConfig = sig.configs.some((c) => fs.existsSync(path.join(context.rootPath, c)));
        if ((hasPackage || hasConfig) && !result.bundler) {
            result.bundler = name;
        }
    }
    // Transpiler
    if (context.allDeps.includes("typescript") ||
        fs.existsSync(path.join(context.rootPath, "tsconfig.json"))) {
        result.transpiler = "TypeScript";
    }
    else if (context.allDeps.includes("@babel/core")) {
        result.transpiler = "Babel";
    }
    else if (context.allDeps.includes("@swc/core")) {
        result.transpiler = "SWC";
    }
    return result;
}
//# sourceMappingURL=testingAndBuildDetector.js.map