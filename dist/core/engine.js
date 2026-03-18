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
exports.PromptEngine = void 0;
const vscode = __importStar(require("vscode"));
const repoScanner_1 = require("../intelligence/repoScanner");
const intentResolver_1 = require("../intent/intentResolver");
const contextCompressor_1 = require("../intelligence/contextCompressor");
const inputValidator_1 = require("../intelligence/inputValidator");
const promptQualityAnalyzer_1 = require("../intelligence/promptQualityAnalyzer");
const taskAnalyzer_1 = require("../intelligence/taskAnalyzer");
const targetedContextExtractor_1 = require("../intelligence/targetedContextExtractor");
const smartPromptGenerator_1 = require("../templates/smartPromptGenerator");
const dependencyImpactAnalyzer_1 = require("../intelligence/dependencyImpactAnalyzer");
class PromptEngine {
    scanner = new repoScanner_1.RepoScanner();
    resolver = new intentResolver_1.IntentResolver();
    compressor = new contextCompressor_1.ContextCompressor();
    async generate(root, userInput) {
        // 1. Validate input quality
        const inputAnalysis = (0, inputValidator_1.analyzeInputQuality)(userInput);
        // 2. Get active editor file info
        const activeEditor = vscode.window.activeTextEditor;
        const activeFilePath = activeEditor?.document.uri.fsPath;
        const activeFileContent = activeEditor?.document.getText();
        // 3. Deep task analysis - understand what the user wants
        const taskAnalysis = (0, taskAnalyzer_1.analyzeTask)(userInput, activeFilePath);
        // 4. Scan repository for structure
        const scan = await this.scanner.scan(root);
        // 5. Detect scenario from user input
        const scenario = this.resolver.resolve(userInput);
        // 6. Get repo context summary (tech stack, dependencies)
        const repoContext = this.compressor.compress(scan);
        const techStack = this.compressor.getTechStack();
        // 7. Detect framework
        const framework = techStack?.frameworks[0]?.name ||
            (scan.insights.hasAngular ? "Angular" :
                scan.insights.hasReact ? "React" :
                    techStack?.primaryLanguage || "TypeScript");
        // 8. Get test frameworks (collect all detected testing tools)
        const testFramework = techStack?.architecture.testing.framework ||
            scan.insights.testFramework || "Jest";
        const testFrameworks = collectTestFrameworks(techStack || undefined, scan);
        const testCommands = detectTestCommands(root, techStack || undefined, testFrameworks);
        // 9. Extract targeted context based on task analysis
        const targetedContext = (0, targetedContextExtractor_1.extractTargetedContext)(taskAnalysis, root, activeFilePath, activeFileContent, scan.structure.classes);
        const codeContext = (0, targetedContextExtractor_1.formatTargetedContext)(targetedContext);
        // 10. Analyze dependency impact (what files could break)
        let dependencyImpact;
        if (activeFilePath && (taskAnalysis.action === "modify" ||
            taskAnalysis.action === "refactor" ||
            taskAnalysis.action === "fix" ||
            taskAnalysis.action === "delete")) {
            dependencyImpact = (0, dependencyImpactAnalyzer_1.analyzeDependencyImpact)(activeFilePath, root);
        }
        // 11. Generate smart, LLM-optimized prompt
        const smartPrompt = (0, smartPromptGenerator_1.generateSmartPrompt)({
            scenario,
            framework,
            task: taskAnalysis,
            repoContext,
            codeContext,
            testFramework,
            testFrameworks,
            testCommands,
            dependencyImpact
        });
        // 11. Calculate real-time quality score
        const qualityAnalysis = (0, promptQualityAnalyzer_1.analyzePromptQuality)({
            userTask: userInput,
            activeFilePath,
            activeFileContent,
            relevantFilesCount: targetedContext.relatedFiles.length,
            classesFound: scan.structure.classes.length,
            methodsFound: scan.structure.classes.reduce((sum, c) => sum + c.methods.length, 0),
            interfacesFound: targetedContext.relatedClasses.length,
            frameworkDetected: framework,
            hasRoutes: scan.insights.hasRouting,
            hasAPIs: scan.structure.services.length > 0,
            dependenciesCount: Object.keys(scan.dependencies).length,
            repoStructureDepth: (scan.structure.classes.length > 0 ? 3 : 1)
        });
        return {
            prompt: smartPrompt,
            qualityScore: qualityAnalysis.overallScore,
            qualityExplanation: (0, promptQualityAnalyzer_1.explainQuality)(qualityAnalysis),
            qualityDetails: qualityAnalysis,
            taskAnalysis,
            inputIssues: inputAnalysis.issues.map(i => ({ type: i.type, message: i.message })),
            suggestions: [...inputAnalysis.suggestions, ...qualityAnalysis.improvements]
        };
    }
    /**
     * Legacy method for backward compatibility
     */
    async generateSimple(root, userInput) {
        const result = await this.generate(root, userInput);
        return result.prompt;
    }
}
exports.PromptEngine = PromptEngine;
/**
 * Collect all detected test frameworks from tech stack and scan results
 */
function collectTestFrameworks(techStack, scan) {
    const frameworks = new Set();
    // From tech stack architecture
    if (techStack?.architecture.testing.framework) {
        frameworks.add(techStack.architecture.testing.framework);
    }
    if (techStack?.architecture.testing.e2e) {
        frameworks.add(techStack.architecture.testing.e2e);
    }
    // From scan insights
    if (scan.insights.testFramework) {
        frameworks.add(scan.insights.testFramework);
    }
    return Array.from(frameworks);
}
/**
 * Detect test commands from package.json scripts or project configuration
 */
function detectTestCommands(root, techStack, testFrameworks) {
    const commands = {};
    const fs = require("fs");
    const path = require("path");
    // Try to detect from package.json (Node.js projects)
    const packageJsonPath = path.join(root, "package.json");
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const scripts = packageJson.scripts || {};
            // Detect unit test command
            if (scripts.test) {
                commands.unit = `npm test`;
            }
            if (scripts["test:unit"]) {
                commands.unit = `npm run test:unit`;
            }
            // Detect integration test command
            if (scripts["test:integration"]) {
                commands.integration = `npm run test:integration`;
            }
            if (scripts["test:int"]) {
                commands.integration = `npm run test:int`;
            }
            // Detect E2E test command
            if (scripts["test:e2e"]) {
                commands.e2e = `npm run test:e2e`;
            }
            if (scripts.e2e) {
                commands.e2e = `npm run e2e`;
            }
            if (scripts.cypress) {
                commands.e2e = `npm run cypress`;
            }
            if (scripts["cypress:run"]) {
                commands.e2e = `npm run cypress:run`;
            }
            if (scripts.playwright) {
                commands.e2e = `npm run playwright`;
            }
            // Detect all tests command
            if (scripts["test:all"]) {
                commands.all = `npm run test:all`;
            }
            if (scripts["test:ci"]) {
                commands.all = `npm run test:ci`;
            }
        }
        catch {
            // Ignore parse errors
        }
    }
    // Try to detect from Makefile (C/C++ projects)
    const makefilePath = path.join(root, "Makefile");
    if (fs.existsSync(makefilePath)) {
        try {
            const makefile = fs.readFileSync(makefilePath, "utf-8");
            if (makefile.includes("test:") || makefile.includes("test :")) {
                commands.unit = `make test`;
            }
            if (makefile.includes("check:") || makefile.includes("check :")) {
                commands.unit = commands.unit || `make check`;
            }
        }
        catch {
            // Ignore read errors
        }
    }
    // Try to detect from CMakeLists.txt (CMake projects)
    const cmakePath = path.join(root, "CMakeLists.txt");
    if (fs.existsSync(cmakePath)) {
        commands.unit = commands.unit || `ctest --output-on-failure`;
    }
    // Detect Python test commands
    if (techStack?.primaryLanguage?.toLowerCase().includes("python") ||
        fs.existsSync(path.join(root, "pytest.ini")) ||
        fs.existsSync(path.join(root, "setup.py")) ||
        fs.existsSync(path.join(root, "pyproject.toml"))) {
        commands.unit = commands.unit || `pytest`;
        commands.all = commands.all || `pytest -v --cov`;
    }
    // Detect Robot Framework tests
    const hasRobotTests = testFrameworks.some(f => f.toLowerCase().includes("robot")) ||
        fs.existsSync(path.join(root, "robot.yaml")) ||
        fs.readdirSync(root).some((f) => f.endsWith(".robot"));
    if (hasRobotTests) {
        commands.e2e = commands.e2e || `robot tests/`;
    }
    // Detect Go tests
    if (techStack?.primaryLanguage?.toLowerCase() === "go" ||
        fs.existsSync(path.join(root, "go.mod"))) {
        commands.unit = `go test ./...`;
        commands.all = `go test -v -cover ./...`;
    }
    // Detect Java tests (Maven/Gradle)
    if (fs.existsSync(path.join(root, "pom.xml"))) {
        commands.unit = `mvn test`;
        commands.all = `mvn verify`;
    }
    if (fs.existsSync(path.join(root, "build.gradle")) ||
        fs.existsSync(path.join(root, "build.gradle.kts"))) {
        commands.unit = `gradle test`;
        commands.all = `gradle check`;
    }
    return commands;
}
//# sourceMappingURL=engine.js.map