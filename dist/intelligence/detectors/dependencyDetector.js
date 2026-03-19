"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeDependencies = categorizeDependencies;
exports.detectProjectType = detectProjectType;
const detectorContext_1 = require("./detectorContext");
const frameworkConstants_1 = require("./frameworkConstants");
/**
 * Categorize dependencies from package.json
 */
function categorizeDependencies(context) {
    const production = [];
    const development = [];
    const byCategory = {};
    const categorize = (name) => {
        for (const [category, packages] of Object.entries(frameworkConstants_1.DEPENDENCY_CATEGORIES)) {
            if (packages.some((p) => name.includes(p) || name === p)) {
                return category;
            }
        }
        if (name.startsWith("@types/"))
            return "Type Definitions";
        if (name.includes("eslint") || name.includes("prettier"))
            return "Linting/Formatting";
        if (name.includes("test") || name.includes("spec"))
            return "Testing";
        return "Other";
    };
    if (context.packageJson) {
        for (const [name, version] of Object.entries(context.packageJson.dependencies || {})) {
            const category = categorize(name);
            const info = {
                name,
                version: String(version).replace(/[\^~]/, ""),
                type: "production",
                category
            };
            production.push(info);
            if (!byCategory[category])
                byCategory[category] = [];
            byCategory[category].push(info);
        }
        for (const [name, version] of Object.entries(context.packageJson.devDependencies || {})) {
            const category = categorize(name);
            const info = {
                name,
                version: String(version).replace(/[\^~]/, ""),
                type: "development",
                category
            };
            development.push(info);
            if (!byCategory[category])
                byCategory[category] = [];
            byCategory[category].push(info);
        }
    }
    // For non-JS projects, detect from build systems
    if (!context.packageJson && context.detectedBuildSystems.length > 0) {
        // Add build system as a "dependency"
        for (const system of context.detectedBuildSystems) {
            const info = {
                name: system,
                version: "detected",
                type: "production",
                category: "Build System"
            };
            production.push(info);
            if (!byCategory["Build System"])
                byCategory["Build System"] = [];
            byCategory["Build System"].push(info);
        }
    }
    // Add detected test frameworks
    for (const framework of context.detectedTestFrameworks) {
        if (!production.some((d) => d.name === framework) &&
            !development.some((d) => d.name === framework)) {
            const info = {
                name: framework,
                version: "detected",
                type: "development",
                category: "Testing"
            };
            development.push(info);
            if (!byCategory["Testing"])
                byCategory["Testing"] = [];
            byCategory["Testing"].push(info);
        }
    }
    return { production, development, byCategory };
}
/**
 * Detect project type based on frameworks, language, and build system
 */
function detectProjectType(context, frameworks, primaryLanguage) {
    const primary = frameworks[0]?.name;
    const buildSystems = context.detectedBuildSystems;
    // C/C++ project types
    if (primaryLanguage === "C++" || primaryLanguage === "C") {
        if (buildSystems.includes("CMake") || buildSystems.includes("Make")) {
            if ((0, detectorContext_1.hasLanguageFiles)(context, [".cpp", ".cc", ".c", ".h", ".hpp"])) {
                const hasTests = context.fileExtensionCounts[".cpp"] &&
                    (context.fileExtensionCounts[".cpp"] || 0) > 0;
                if (hasTests) {
                    return "C/C++ Application with Tests";
                }
            }
            return "C/C++ Application";
        }
        if (buildSystems.includes("BMS") || buildSystems.includes("CMK")) {
            return "Enterprise C/C++ System";
        }
        return "C/C++ Project";
    }
    // Python project types
    if (primaryLanguage === "Python") {
        if (context.detectedTestFrameworks.includes("Robot Framework")) {
            return "Python Application with Robot Framework Tests";
        }
        if (frameworks.some((f) => f.name === "Django")) {
            return "Django Web Application";
        }
        if (frameworks.some((f) => f.name === "Flask" || f.name === "FastAPI")) {
            return "Python API Server";
        }
        return "Python Application";
    }
    // Java project types
    if (primaryLanguage === "Java" || primaryLanguage === "Java/Kotlin") {
        if (buildSystems.includes("Maven") || buildSystems.includes("Gradle")) {
            return "Java/JVM Application";
        }
        return "Java Project";
    }
    // JavaScript/TypeScript frameworks
    if (["Next.js", "Nuxt", "Remix", "Gatsby", "Astro"].includes(primary || "")) {
        return "Full-Stack Web Application";
    }
    if (["React", "Vue", "Angular", "Svelte", "Solid"].includes(primary || "")) {
        return "Single Page Application (SPA)";
    }
    if (["Express", "NestJS", "Fastify", "Koa", "Hono"].includes(primary || "")) {
        return "Backend API Server";
    }
    if (["Electron", "Tauri"].includes(primary || "")) {
        return "Desktop Application";
    }
    if (["React Native", "Expo"].includes(primary || "")) {
        return "Mobile Application";
    }
    // Mixed/Enterprise
    if (buildSystems.length > 1) {
        return "Multi-Technology Enterprise System";
    }
    if (context.packageJson?.main && !primary) {
        return "Node.js Library/Package";
    }
    return `${primaryLanguage} Application`;
}
//# sourceMappingURL=dependencyDetector.js.map