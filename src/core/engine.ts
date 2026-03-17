import * as vscode from "vscode";
import { RepoScanner } from "../intelligence/repoScanner";
import { IntentResolver } from "../intent/intentResolver";
import { ContextCompressor } from "../intelligence/contextCompressor";
import { analyzeInputQuality } from "../intelligence/inputValidator";
import { analyzePromptQuality, explainQuality, PromptQualityResult } from "../intelligence/promptQualityAnalyzer";
import { analyzeTask, AnalyzedTask } from "../intelligence/taskAnalyzer";
import { extractTargetedContext, formatTargetedContext } from "../intelligence/targetedContextExtractor";
import { generateSmartPrompt } from "../templates/smartPromptGenerator";
import { analyzeDependencyImpact, DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";

export interface PromptResult {
  prompt: string;
  qualityScore: number;
  qualityExplanation: string;
  qualityDetails: PromptQualityResult;
  taskAnalysis: AnalyzedTask;
  inputIssues: { type: string; message: string }[];
  suggestions: string[];
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
    const repoContext = this.compressor.compress(scan);
    const techStack = this.compressor.getTechStack();

    // 7. Detect framework
    const framework = techStack?.frameworks[0]?.name || 
      (scan.insights.hasAngular ? "Angular" : 
       scan.insights.hasReact ? "React" : 
       techStack?.primaryLanguage || "TypeScript");

    // 8. Get test framework
    const testFramework = techStack?.architecture.testing.framework || 
      scan.insights.testFramework || "Jest";

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
}