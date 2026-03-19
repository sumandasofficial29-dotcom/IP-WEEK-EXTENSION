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
exports.readProjectConfig = readProjectConfig;
exports.readTestingConfig = readTestingConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Project configuration and instructions reader
 * Reads copilot-instructions.md, README.md, CONTRIBUTING.md, and other project docs
 * Enhanced for complex enterprise repos (C++, no package.json, scattered documentation)
 *
 * CACHING: Project config is cached for 5 minutes to avoid repeated file reads
 */
// Cache for project config (TTL: 5 minutes)
const CONFIG_CACHE_TTL = 5 * 60 * 1000;
const configCache = new Map();
const testingCache = new Map();
/**
 * Read project-specific configuration files that contain coding guidelines,
 * testing instructions, and other context useful for generating prompts
 * Enhanced to handle complex enterprise repos with scattered documentation
 */
function readProjectConfig(rootPath) {
    // Check cache first
    const cached = configCache.get(rootPath);
    if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
        console.log('[PromptCraft] Using cached project config');
        return cached.data;
    }
    const config = {
        customInstructions: [],
        componentDocs: []
    };
    // Read copilot-instructions.md (search multiple locations for enterprise repos)
    const copilotPaths = [
        // GitHub Copilot standard locations
        path.join(rootPath, ".github", "copilot-instructions.md"),
        path.join(rootPath, ".github", "copilot", "copilot-instructions.md"),
        path.join(rootPath, ".github", "copilot", "readme.md"),
        path.join(rootPath, ".github", "copilot", "instructions.md"),
        // Root level variations
        path.join(rootPath, ".copilot-instructions.md"),
        path.join(rootPath, "copilot-instructions.md"),
        path.join(rootPath, "COPILOT_INSTRUCTIONS.md"),
        // Documentation folders
        path.join(rootPath, "docs", "copilot-instructions.md"),
        path.join(rootPath, "Documentation", "copilot-instructions.md"),
        path.join(rootPath, "doc", "copilot-instructions.md")
    ];
    for (const p of copilotPaths) {
        if (fs.existsSync(p)) {
            try {
                config.copilotInstructions = fs.readFileSync(p, "utf-8").trim();
                // Limit size to avoid token bloat
                if (config.copilotInstructions.length > 3000) {
                    config.copilotInstructions = config.copilotInstructions.substring(0, 3000) + "\n... (truncated)";
                }
                break;
            }
            catch { /* skip */ }
        }
    }
    // Read README for project context (search multiple locations)
    const readmePaths = [
        path.join(rootPath, "README.md"),
        path.join(rootPath, "readme.md"),
        path.join(rootPath, "Readme.md"),
        path.join(rootPath, "README.rst"),
        path.join(rootPath, "README.txt")
    ];
    for (const p of readmePaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, "utf-8");
                config.readme = extractRelevantReadmeSections(content);
                break;
            }
            catch { /* skip */ }
        }
    }
    // Read CONTRIBUTING.md for code style guidelines
    const contributingPaths = [
        path.join(rootPath, "CONTRIBUTING.md"),
        path.join(rootPath, ".github", "CONTRIBUTING.md"),
        path.join(rootPath, "docs", "CONTRIBUTING.md"),
        path.join(rootPath, "Documentation", "CONTRIBUTING.md")
    ];
    for (const p of contributingPaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, "utf-8");
                config.contributing = extractRelevantContributingSections(content);
                break;
            }
            catch { /* skip */ }
        }
    }
    // Read VERSIONING.md if present
    const versioningPaths = [
        path.join(rootPath, "VERSIONING.md"),
        path.join(rootPath, "VERSION.md"),
        path.join(rootPath, "docs", "VERSIONING.md")
    ];
    for (const p of versioningPaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, "utf-8");
                config.versioningInfo = extractVersioningInfo(content);
                break;
            }
            catch { /* skip */ }
        }
    }
    // Detect build system and configuration
    config.buildSystem = detectBuildSystem(rootPath);
    // Find component-specific documentation
    config.componentDocs = findComponentDocs(rootPath);
    // Read style guides and editor configs
    const styleGuides = [
        path.join(rootPath, ".editorconfig"),
        path.join(rootPath, ".prettierrc"),
        path.join(rootPath, ".prettierrc.json"),
        path.join(rootPath, ".eslintrc.json"),
        path.join(rootPath, ".eslintrc.js"),
        path.join(rootPath, "tslint.json"),
        path.join(rootPath, ".clang-format"),
        path.join(rootPath, ".clang-tidy")
    ];
    for (const p of styleGuides) {
        if (fs.existsSync(p)) {
            config.codeStyle = path.basename(p) + " present";
            break;
        }
    }
    // Check for doxygen configuration (C++ projects)
    const doxygenPaths = [
        path.join(rootPath, "Doxyfile"),
        path.join(rootPath, "doxygen.cfg"),
        path.join(rootPath, "doc", "Doxyfile"),
        path.join(rootPath, "docs", "Doxyfile")
    ];
    for (const p of doxygenPaths) {
        if (fs.existsSync(p)) {
            config.doxygenConfig = "Doxygen configured";
            break;
        }
    }
    // Cache the result
    configCache.set(rootPath, { data: config, timestamp: Date.now() });
    console.log('[PromptCraft] Project config cached');
    return config;
}
/**
 * Extract testing instructions from project files
 * Enhanced to handle enterprise C++ repos and various build systems
 */
function readTestingConfig(rootPath) {
    // Check cache first
    const cached = testingCache.get(rootPath);
    if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
        console.log('[PromptCraft] Using cached testing config');
        return cached.data;
    }
    const config = {
        commands: []
    };
    // Check for test scripts in package.json (Node.js projects)
    const packageJsonPath = path.join(rootPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const scripts = pkg.scripts || {};
            if (scripts.test)
                config.commands.push(`npm test`);
            if (scripts["test:unit"])
                config.commands.push(`npm run test:unit`);
            if (scripts["test:e2e"])
                config.commands.push(`npm run test:e2e`);
            if (scripts["test:integration"])
                config.commands.push(`npm run test:integration`);
            // Detect test framework
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.jest)
                config.framework = "Jest";
            else if (deps.mocha)
                config.framework = "Mocha";
            else if (deps.vitest)
                config.framework = "Vitest";
            else if (deps.cypress)
                config.framework = "Cypress";
            else if (deps["@playwright/test"])
                config.framework = "Playwright";
        }
        catch { /* skip */ }
    }
    // Check for CMake test targets (C++ projects)
    const cmakePaths = [
        path.join(rootPath, "CMakeLists.txt"),
        path.join(rootPath, "cmake", "CMakeLists.txt")
    ];
    for (const p of cmakePaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, "utf-8");
                if (content.includes("enable_testing") || content.includes("add_test")) {
                    config.commands.push("ctest");
                    config.framework = "CTest";
                }
                if (content.includes("gtest") || content.includes("GTest")) {
                    config.framework = "Google Test";
                }
                if (content.includes("catch") || content.includes("Catch2")) {
                    config.framework = "Catch2";
                }
                break;
            }
            catch { /* skip */ }
        }
    }
    // Check for Forest.xml (enterprise build system)
    const forestPath = path.join(rootPath, "Forest.xml");
    if (fs.existsSync(forestPath)) {
        try {
            const content = fs.readFileSync(forestPath, "utf-8");
            config.commands.push("forest build");
            if (content.includes("test") || content.includes("Test")) {
                config.commands.push("forest test");
            }
            config.framework = "Forest Build System";
        }
        catch { /* skip */ }
    }
    // Check for Makefile test targets
    const makefilePaths = [
        path.join(rootPath, "Makefile"),
        path.join(rootPath, "GNUmakefile"),
        path.join(rootPath, "makefile")
    ];
    for (const mp of makefilePaths) {
        if (fs.existsSync(mp)) {
            try {
                const content = fs.readFileSync(mp, "utf-8");
                if (content.match(/^test\s*:/m))
                    config.commands.push("make test");
                if (content.match(/^check\s*:/m))
                    config.commands.push("make check");
                if (content.match(/^unittest\s*:/m))
                    config.commands.push("make unittest");
                if (!config.framework)
                    config.framework = "Make";
                break;
            }
            catch { /* skip */ }
        }
    }
    // Check for pytest (Python)
    const pytestPaths = [
        path.join(rootPath, "pytest.ini"),
        path.join(rootPath, "pyproject.toml"),
        path.join(rootPath, "setup.py"),
        path.join(rootPath, "conftest.py")
    ];
    for (const p of pytestPaths) {
        if (fs.existsSync(p)) {
            if (!config.commands.includes("pytest")) {
                config.commands.push("pytest");
            }
            config.framework = "pytest";
            break;
        }
    }
    // Check for Robot Framework
    const robotPaths = [
        path.join(rootPath, "robot.yaml"),
        path.join(rootPath, "profiles_regression"),
        path.join(rootPath, ".robot")
    ];
    for (const p of robotPaths) {
        if (fs.existsSync(p)) {
            if (!config.commands.includes("robot tests/")) {
                config.commands.push("robot tests/");
            }
            config.framework = "Robot Framework";
            break;
        }
    }
    // Check for Gradle (Java/Kotlin)
    if (fs.existsSync(path.join(rootPath, "build.gradle")) ||
        fs.existsSync(path.join(rootPath, "build.gradle.kts"))) {
        config.commands.push("./gradlew test");
        config.framework = "JUnit (Gradle)";
    }
    // Check for Maven (Java)
    if (fs.existsSync(path.join(rootPath, "pom.xml"))) {
        config.commands.push("mvn test");
        config.framework = "JUnit (Maven)";
    }
    // Read test README if exists (search multiple locations)
    const testReadmes = [
        path.join(rootPath, "tests", "README.md"),
        path.join(rootPath, "test", "README.md"),
        path.join(rootPath, "profiles_regression", "README.md"),
        path.join(rootPath, "regression", "README.md"),
        path.join(rootPath, "testing", "README.md")
    ];
    for (const p of testReadmes) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, "utf-8");
                config.instructions = extractTestInstructions(content);
                break;
            }
            catch { /* skip */ }
        }
    }
    // Cache the result
    testingCache.set(rootPath, { data: config, timestamp: Date.now() });
    return config;
}
/**
 * Extract relevant sections from README (not the whole file)
 */
function extractRelevantReadmeSections(content) {
    const sections = [];
    const lines = content.split("\n");
    let currentSection = "";
    let inRelevantSection = false;
    let lineCount = 0;
    const relevantHeadings = [
        /^#+\s*(getting started|quick start|setup|installation)/i,
        /^#+\s*(development|contributing|build)/i,
        /^#+\s*(testing|test|tests)/i,
        /^#+\s*(architecture|structure)/i,
        /^#+\s*(api|usage)/i
    ];
    const skipHeadings = [
        /^#+\s*(license|changelog|history|credits|acknowledgements)/i
    ];
    for (const line of lines) {
        const isHeading = line.startsWith("#");
        if (isHeading) {
            // Save previous section if relevant
            if (inRelevantSection && currentSection.trim() && lineCount < 30) {
                sections.push(currentSection.trim());
            }
            currentSection = line + "\n";
            lineCount = 1;
            // Check if this is a relevant section
            inRelevantSection = relevantHeadings.some(r => r.test(line)) &&
                !skipHeadings.some(r => r.test(line));
        }
        else if (inRelevantSection && lineCount < 30) {
            currentSection += line + "\n";
            lineCount++;
        }
    }
    // Don't forget the last section
    if (inRelevantSection && currentSection.trim() && lineCount < 30) {
        sections.push(currentSection.trim());
    }
    const result = sections.join("\n\n").trim();
    return result.length > 1500 ? result.substring(0, 1500) + "\n... (truncated)" : result;
}
/**
 * Extract relevant sections from CONTRIBUTING.md
 */
function extractRelevantContributingSections(content) {
    const lines = content.split("\n");
    const relevantLines = [];
    let inRelevantSection = false;
    let lineCount = 0;
    const relevantHeadings = [
        /^#+\s*(code style|coding standards|style guide)/i,
        /^#+\s*(commit|pull request|pr)/i,
        /^#+\s*(testing|test)/i
    ];
    for (const line of lines) {
        const isHeading = line.startsWith("#");
        if (isHeading) {
            inRelevantSection = relevantHeadings.some(r => r.test(line));
            lineCount = 0;
            if (inRelevantSection) {
                relevantLines.push(line);
            }
        }
        else if (inRelevantSection && lineCount < 20) {
            relevantLines.push(line);
            lineCount++;
        }
    }
    const result = relevantLines.join("\n").trim();
    return result.length > 800 ? result.substring(0, 800) + "\n... (truncated)" : result;
}
/**
 * Extract test instructions from test README
 */
function extractTestInstructions(content) {
    const lines = content.split("\n");
    const relevantLines = [];
    let lineCount = 0;
    // Look for command blocks and key sections
    const relevantHeadings = [
        /^#+\s*(running|run|execute|how to)/i,
        /^#+\s*(setup|prerequisites)/i,
        /^#+\s*(order|sequence)/i
    ];
    let inRelevant = false;
    for (const line of lines) {
        const isHeading = line.startsWith("#");
        if (isHeading) {
            inRelevant = relevantHeadings.some(r => r.test(line));
            lineCount = 0;
            if (inRelevant)
                relevantLines.push(line);
        }
        else if (inRelevant && lineCount < 15) {
            relevantLines.push(line);
            lineCount++;
        }
        else if (line.includes("```") || line.startsWith("$") || line.startsWith(">")) {
            // Include command examples
            relevantLines.push(line);
        }
    }
    const result = relevantLines.join("\n").trim();
    return result.length > 500 ? result.substring(0, 500) + "\n... (truncated)" : result;
}
/**
 * Detect build system type and configuration
 */
function detectBuildSystem(rootPath) {
    const config = {
        type: "unknown",
        buildCommands: [],
        testCommands: []
    };
    // Check for Forest.xml (Amadeus enterprise build)
    const forestPath = path.join(rootPath, "Forest.xml");
    if (fs.existsSync(forestPath)) {
        config.type = "forest";
        config.configFile = "Forest.xml";
        config.buildCommands = ["forest build"];
        config.testCommands = ["forest test"];
        return config;
    }
    // Check for workbench.yaml (enterprise config)
    const workbenchPath = path.join(rootPath, "workbench.yaml");
    if (fs.existsSync(workbenchPath)) {
        try {
            const content = fs.readFileSync(workbenchPath, "utf-8");
            if (content.includes("build")) {
                config.buildCommands.push("workbench build");
            }
        }
        catch { /* skip */ }
    }
    // Check for CMake
    const cmakePath = path.join(rootPath, "CMakeLists.txt");
    if (fs.existsSync(cmakePath)) {
        config.type = "cmake";
        config.configFile = "CMakeLists.txt";
        config.buildCommands = ["cmake --build .", "mkdir build && cd build && cmake .. && make"];
        config.testCommands = ["ctest", "make test"];
        return config;
    }
    // Check for Makefile
    const makefilePaths = ["Makefile", "GNUmakefile", "makefile"];
    for (const mf of makefilePaths) {
        const mfPath = path.join(rootPath, mf);
        if (fs.existsSync(mfPath)) {
            config.type = "make";
            config.configFile = mf;
            config.buildCommands = ["make", "make all"];
            try {
                const content = fs.readFileSync(mfPath, "utf-8");
                if (content.match(/^test\s*:/m))
                    config.testCommands.push("make test");
                if (content.match(/^check\s*:/m))
                    config.testCommands.push("make check");
            }
            catch { /* skip */ }
            return config;
        }
    }
    // Check for Bazel
    if (fs.existsSync(path.join(rootPath, "BUILD")) ||
        fs.existsSync(path.join(rootPath, "BUILD.bazel")) ||
        fs.existsSync(path.join(rootPath, "WORKSPACE"))) {
        config.type = "bazel";
        config.buildCommands = ["bazel build //..."];
        config.testCommands = ["bazel test //..."];
        return config;
    }
    // Check for Meson
    if (fs.existsSync(path.join(rootPath, "meson.build"))) {
        config.type = "meson";
        config.configFile = "meson.build";
        config.buildCommands = ["meson setup build", "ninja -C build"];
        config.testCommands = ["meson test -C build"];
        return config;
    }
    // Check for package.json (npm/node)
    const packageJsonPath = path.join(rootPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
        config.type = "npm";
        config.configFile = "package.json";
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const scripts = pkg.scripts || {};
            if (scripts.build)
                config.buildCommands.push("npm run build");
            if (scripts.compile)
                config.buildCommands.push("npm run compile");
            if (scripts.test)
                config.testCommands.push("npm test");
        }
        catch { /* skip */ }
        return config;
    }
    // Check for Gradle
    if (fs.existsSync(path.join(rootPath, "build.gradle")) ||
        fs.existsSync(path.join(rootPath, "build.gradle.kts"))) {
        config.type = "gradle";
        config.buildCommands = ["./gradlew build"];
        config.testCommands = ["./gradlew test"];
        return config;
    }
    // Check for Maven
    if (fs.existsSync(path.join(rootPath, "pom.xml"))) {
        config.type = "maven";
        config.configFile = "pom.xml";
        config.buildCommands = ["mvn compile", "mvn package"];
        config.testCommands = ["mvn test"];
        return config;
    }
    return config;
}
/**
 * Find component-specific documentation (READMEs in subdirectories)
 */
function findComponentDocs(rootPath) {
    const docs = [];
    // Common documentation locations in enterprise repos
    const searchDirs = [
        "Documentation",
        "docs",
        "doc",
        ".github",
        ".github/copilot",
        "src",
        "lib",
        "components",
        "modules",
        "packages"
    ];
    // Also check first-level subdirectories for component READMEs
    try {
        const entries = fs.readdirSync(rootPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".") &&
                !["node_modules", "dist", "build", "out", "target", ".git"].includes(entry.name)) {
                searchDirs.push(entry.name);
            }
        }
    }
    catch { /* skip */ }
    const seen = new Set();
    for (const dir of searchDirs) {
        const dirPath = path.join(rootPath, dir);
        if (!fs.existsSync(dirPath))
            continue;
        // Look for README files
        const readmeNames = ["README.md", "readme.md", "Readme.md", "README.txt", "README"];
        for (const readme of readmeNames) {
            const readmePath = path.join(dirPath, readme);
            if (fs.existsSync(readmePath) && !seen.has(readmePath)) {
                seen.add(readmePath);
                try {
                    const content = fs.readFileSync(readmePath, "utf-8");
                    const summary = extractDocSummary(content);
                    if (summary) {
                        docs.push({
                            component: dir,
                            path: path.relative(rootPath, readmePath),
                            summary
                        });
                    }
                }
                catch { /* skip */ }
            }
        }
        // Look for specific docs files in Documentation folder
        if (dir === "Documentation" || dir === "docs") {
            try {
                const docFiles = fs.readdirSync(dirPath);
                for (const file of docFiles) {
                    if (file.endsWith(".md") && !seen.has(path.join(dirPath, file))) {
                        const filePath = path.join(dirPath, file);
                        seen.add(filePath);
                        try {
                            const content = fs.readFileSync(filePath, "utf-8");
                            const summary = extractDocSummary(content);
                            if (summary) {
                                docs.push({
                                    component: file.replace(".md", ""),
                                    path: path.relative(rootPath, filePath),
                                    summary
                                });
                            }
                        }
                        catch { /* skip */ }
                    }
                    // Limit to prevent too many docs
                    if (docs.length >= 10)
                        break;
                }
            }
            catch { /* skip */ }
        }
        // Limit total docs
        if (docs.length >= 10)
            break;
    }
    return docs;
}
/**
 * Extract a brief summary from documentation file
 */
function extractDocSummary(content) {
    const lines = content.split("\n").slice(0, 20); // First 20 lines
    // Find first non-header, non-empty paragraph
    let summary = "";
    let foundContent = false;
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headers and empty lines until we find content
        if (trimmed.startsWith("#") || trimmed === "") {
            if (foundContent)
                break; // End of first paragraph
            continue;
        }
        // Skip badges, links at the start
        if (trimmed.startsWith("![") || trimmed.startsWith("[![")) {
            continue;
        }
        foundContent = true;
        summary += " " + trimmed;
        // Stop after ~150 chars
        if (summary.length > 150) {
            break;
        }
    }
    return summary.trim().substring(0, 200);
}
/**
 * Extract versioning information from VERSIONING.md
 */
function extractVersioningInfo(content) {
    const lines = content.split("\n").slice(0, 30);
    const relevantLines = [];
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headers but keep content
        if (trimmed.startsWith("##") || trimmed === "")
            continue;
        if (trimmed.startsWith("#")) {
            relevantLines.push(trimmed);
            continue;
        }
        relevantLines.push(trimmed);
        if (relevantLines.length >= 10)
            break;
    }
    return relevantLines.join("\n").substring(0, 500);
}
//# sourceMappingURL=projectConfigReader.js.map