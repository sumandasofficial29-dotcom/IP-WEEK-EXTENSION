import * as vscode from "vscode";
import { RepoScanner } from "../intelligence/repoScanner";
import { IntentResolver } from "../intent/intentResolver";
import { ContextCompressor } from "../intelligence/contextCompressor";
import { analyzeInputQuality } from "../intelligence/inputValidator";
import { analyzePromptQuality, explainQuality, PromptQualityResult } from "../intelligence/promptQualityAnalyzer";
import { analyzeTask, AnalyzedTask } from "../intelligence/taskAnalyzer";
import { extractTargetedContext, formatTargetedContext } from "../intelligence/targetedContextExtractor";
import { generateSmartPrompt, TestCommands } from "../templates/smartPromptGenerator";
import { analyzeDependencyImpact, DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";
import { 
  generateFocusedPrompt, 
  generateCustomPrompt, 
  getDefaultOptions, 
  PromptOptions 
} from "../templates/focusedPromptGenerator";

export interface PromptResult {
  prompt: string;
  qualityScore: number;
  qualityExplanation: string;
  qualityDetails: PromptQualityResult;
  taskAnalysis: AnalyzedTask;
  inputIssues: { type: string; message: string }[];
  suggestions: string[];
}

export interface FocusedPromptResult {
  prompt: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    required: boolean;
    editable: boolean;
  }>;
  taskAnalysis: AnalyzedTask;
  options: PromptOptions;
  metadata: {
    estimatedTokens: number;
    hasProjectInstructions: boolean;
    hasTestInstructions: boolean;
    primaryLanguage: string;
    frameworks: string[];
  };
}

export class PromptEngine {
  private scanner = new RepoScanner();
  private resolver = new IntentResolver();
  private compressor = new ContextCompressor();

  async generate(root: string, userInput: string): Promise<PromptResult> {
    // 1. Validate input quality
    const inputAnalysis = analyzeInputQuality(userInput);

    // 2. Get active editor file info
    const activeEditor = vscode.window.activeTextEditor;
    const activeFilePath = activeEditor?.document.uri.fsPath;
    const activeFileContent = activeEditor?.document.getText();

    // 3. Deep task analysis - understand what the user wants
    const taskAnalysis = analyzeTask(userInput, activeFilePath);

    // 4. Scan repository for structure
    const scan = await this.scanner.scan(root);

    // 5. Detect scenario from user input
    const scenario = this.resolver.resolve(userInput);

    // 6. Get repo context summary (tech stack, dependencies)
    let repoContext = this.compressor.compress(scan);
    const techStack = this.compressor.getTechStack();
    
    // Enhance repo context with BMS-specific information if detected
    if (techStack?.architecture.bms) {
      repoContext = enhanceWithBmsContext(repoContext, techStack.architecture.bms);
    }

    // 7. Detect framework (use BMS framework if available)
    let framework = techStack?.frameworks[0]?.name || 
      (scan.insights.hasAngular ? "Angular" : 
       scan.insights.hasReact ? "React" : 
       techStack?.primaryLanguage || "TypeScript");
    
    // Add version info for C++ BMS projects
    if (framework === "C++ BMS/MDW" && techStack?.frameworks[0]?.version) {
      framework = `${framework} (${techStack.frameworks[0].version})`;
      if (techStack.architecture.bms?.cppStandard) {
        framework +=` ${techStack.architecture.bms.cppStandard}`;
      }
    }

    // 8. Get test frameworks (collect all detected testing tools)
    const testFramework = techStack?.architecture.testing.framework || 
      scan.insights.testFramework || "Jest";
    
    const testFrameworks = collectTestFrameworks(techStack || undefined, scan);
    const testCommands = detectTestCommands(root, techStack || undefined, testFrameworks);

    // 9. Extract targeted context based on task analysis
    const targetedContext = extractTargetedContext(
      taskAnalysis,
      root,
      activeFilePath,
      activeFileContent,
      scan.structure.classes
    );
    const codeContext = formatTargetedContext(targetedContext);

    // 10. Analyze dependency impact (what files could break)
    let dependencyImpact: DependencyImpact | undefined;
    if (activeFilePath && (taskAnalysis.action === "modify" || 
                           taskAnalysis.action === "refactor" ||
                           taskAnalysis.action === "fix" ||
                           taskAnalysis.action === "delete")) {
      dependencyImpact = analyzeDependencyImpact(activeFilePath, root);
    }

    // 11. Generate smart, LLM-optimized prompt
    const smartPrompt = generateSmartPrompt({
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
    const qualityAnalysis = analyzePromptQuality({
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
      qualityExplanation: explainQuality(qualityAnalysis),
      qualityDetails: qualityAnalysis,
      taskAnalysis,
      inputIssues: inputAnalysis.issues.map(i => ({ type: i.type, message: i.message })),
      suggestions: [...inputAnalysis.suggestions, ...qualityAnalysis.improvements]
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateSimple(root: string, userInput: string): Promise<string> {
    const result = await this.generate(root, userInput);
    return result.prompt;
  }

  /**
   * NEW: Generate combined prompt with all features
   * Combines classic mode's rich context with focused mode's options
   */
  async generateFocused(root: string, userInput: string, customOptions?: Partial<PromptOptions>): Promise<FocusedPromptResult> {
    // 1. Get active editor file info
    const activeEditor = vscode.window.activeTextEditor;
    const activeFilePath = activeEditor?.document.uri.fsPath;
    const activeFileContent = activeEditor?.document.getText();

    // 2. Deep task analysis
    const taskAnalysis = analyzeTask(userInput, activeFilePath);

    // 3. Full repo scan (includes folder structure, tech stack, everything)
    const scan = await this.scanner.scan(root);

    // 4. Detect scenario from user input
    const scenario = this.resolver.resolve(userInput);

    // 5. Get repo context summary (tech stack, dependencies, folder structure)
    let repoContext = this.compressor.compress(scan);
    const techStack = this.compressor.getTechStack();

    // Enhance repo context with BMS-specific information if detected (design patterns, middleware patterns, etc.)
    if (techStack?.architecture.bms) {
      repoContext = enhanceWithBmsContext(repoContext, techStack.architecture.bms);
    }

    // 6. Detect framework (use BMS framework if available)
    let framework = techStack?.frameworks[0]?.name || 
      (scan.insights.hasAngular ? "Angular" : 
       scan.insights.hasReact ? "React" : 
       techStack?.primaryLanguage || "TypeScript");

    // Add version info for C++ BMS projects
    if (framework === "C++ BMS/MDW" && techStack?.frameworks[0]?.version) {
      framework = `${framework} (${techStack.frameworks[0].version})`;
      if (techStack.architecture.bms?.cppStandard) {
        framework += ` ${techStack.architecture.bms.cppStandard}`;
      }
    }

    // 7. Get test frameworks
    const testFramework = techStack?.architecture.testing.framework || 
      scan.insights.testFramework || "Jest";
    const testFrameworks = collectTestFrameworks(techStack || undefined, scan);
    const testCommands = detectTestCommands(root, techStack || undefined, testFrameworks);

    // 8. Extract targeted context based on task analysis
    const targetedContext = extractTargetedContext(
      taskAnalysis,
      root,
      activeFilePath,
      activeFileContent,
      scan.structure.classes
    );
    const codeContext = formatTargetedContext(targetedContext);

    // 9. Analyze dependency impact
    let dependencyImpact: DependencyImpact | undefined;
    if (activeFilePath && ["modify", "refactor", "fix", "delete"].includes(taskAnalysis.action)) {
      dependencyImpact = analyzeDependencyImpact(activeFilePath, root);
    }

    // 10. Detect primary language and frameworks
    const primaryLanguage = techStack?.primaryLanguage || "Unknown";
    const frameworks = techStack?.frameworks.map(f => f.name) || [];

    // 11. Get default options, override with custom
    const defaultOpts = getDefaultOptions(taskAnalysis);
    const options: PromptOptions = { ...defaultOpts, ...customOptions };

    // 12. Generate COMBINED prompt (classic context + focused options)
    const result = generateFocusedPrompt({
      userRequest: userInput,
      task: taskAnalysis,
      rootPath: root,
      activeFilePath,
      activeFileContent,
      primaryLanguage,
      frameworks,
      // Pass classic mode context
      repoContext,
      codeContext,
      scenario,
      framework,
      testFramework,
      testFrameworks,
      testCommands,
      dependencyImpact,
      options
    });

    return {
      prompt: result.prompt,
      sections: result.sections,
      taskAnalysis,
      options,
      metadata: {
        ...result.metadata,
        primaryLanguage,
        frameworks
      }
    };
  }

  /**
   * Generate custom prompt with user-specified options
   */
  async generateWithOptions(
    root: string, 
    userInput: string, 
    options: PromptOptions,
    additionalContext?: string
  ): Promise<string> {
    const activeEditor = vscode.window.activeTextEditor;
    const activeFilePath = activeEditor?.document.uri.fsPath;
    const activeFileContent = activeEditor?.document.getText();
    
    const taskAnalysis = analyzeTask(userInput, activeFilePath);
    const scan = await this.scanner.scan(root);
    const techStack = this.compressor.compress(scan) ? this.compressor.getTechStack() : null;
    
    const primaryLanguage = techStack?.primaryLanguage || "Unknown";
    const frameworks = techStack?.frameworks.map(f => f.name) || [];

    return generateCustomPrompt({
      userRequest: userInput,
      task: taskAnalysis,
      rootPath: root,
      activeFilePath,
      activeFileContent,
      primaryLanguage,
      frameworks
    }, {
      ...options,
      additionalContext
    });
  }
}

/**
 * Collect all detected test frameworks from tech stack and scan results
 */
function collectTestFrameworks(
  techStack: { architecture: { testing: { framework?: string; e2e?: string } } } | undefined,
  scan: { insights: { testFramework?: string } }
): string[] {
  const frameworks = new Set<string>();
  
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
function detectTestCommands(
  root: string,
  techStack: { primaryLanguage?: string; architecture: { build: { buildSystem?: string } } } | undefined,
  testFrameworks: string[]
): TestCommands {
  const commands: TestCommands = {};
  const fs = require("fs");
  const path = require("path");
  
  // Check for C++ BMS project (bmsrc file)
  const bmsrcPath = path.join(root, "bmsrc");
  if (fs.existsSync(bmsrcPath)) {
    // BMS default test commands
    commands.unit = `bms test`;
    commands.all = `bms test --coverage`;
    
    // Check for specific test profiles in bmsrc
    try {
      const bmsrcContent = fs.readFileSync(bmsrcPath, "utf-8");
      if (bmsrcContent.includes("valgrind")) {
        commands.integration = `bms test --valgrind`;
      }
    } catch {
      // Ignore
    }
  }
  
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
    } catch {
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
    } catch {
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
    fs.readdirSync(root).some((f: string) => f.endsWith(".robot"));
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

/**
 * Enhance repo context with C++ BMS/MDW specific information
 */
function enhanceWithBmsContext(baseContext: string, bmsInfo: {
  modules: string[];
  designPatterns: string[];
  middlewarePatterns: string[];
  middlewareVersion?: string;
  cppStandard?: string;
  bmsDependencies: string[];
  submodules: string[];
}): string {
  const sections: string[] = [baseContext];

  // Add BMS Framework section
  sections.push("\n# C++ BMS/MDW Information\n");
  sections.push(`**Framework:** C++ BMS/MDW`);
  if (bmsInfo.middlewareVersion) {
    sections.push(`**Middleware:** ${bmsInfo.middlewareVersion}`);
  }
  if (bmsInfo.cppStandard) {
    sections.push(`**C++ Standard:** ${bmsInfo.cppStandard}`);
  }

  // Add Modules
  if (bmsInfo.modules.length > 0) {
    sections.push(`\n**Modules (${bmsInfo.modules.length}):**`);
    bmsInfo.modules.slice(0, 10).forEach(mod => {
      sections.push(`- ${mod}`);
    });
    if (bmsInfo.modules.length > 10) {
      sections.push(`  ... and ${bmsInfo.modules.length - 10} more`);
    }
  }

  // Add Design Patterns
  if (bmsInfo.designPatterns.length > 0) {
    sections.push(`\n**Design Patterns:**`);
    bmsInfo.designPatterns.forEach(pattern => {
      sections.push(`- ${pattern}`);
    });
  }

  // Add Middleware Patterns
  if (bmsInfo.middlewarePatterns.length > 0) {
    sections.push(`\n**Middleware Patterns:**`);
    bmsInfo.middlewarePatterns.forEach(pattern => {
      sections.push(`- ${pattern}`);
    });
  }

  // Add Dependencies
  if (bmsInfo.bmsDependencies.length > 0) {
    sections.push(`\n**BMS Dependencies (${bmsInfo.bmsDependencies.length}):**`);
    bmsInfo.bmsDependencies.slice(0, 5).forEach(dep => {
      sections.push(`- ${dep}`);
    });
    if (bmsInfo.bmsDependencies.length > 5) {
      sections.push(`  ... and ${bmsInfo.bmsDependencies.length - 5} more`);
    }
  }

  if (bmsInfo.submodules.length > 0) {
    sections.push(`\n**Submodules:**`);
    bmsInfo.submodules.forEach(sub => {
      sections.push(`- ${sub}`);
    });
  }

  return sections.join("\n");
}
