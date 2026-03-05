import * as vscode from "vscode";
import { RepoScanner } from "../intelligence/repoScanner";
import { PromptAssembler } from "../assembler/promptAssembler";
import { IntentResolver } from "../intent/intentResolver";
import { scoreFiles } from "../intelligence/context/fileRelevanceScorer";
import { buildSmartContext } from "../intelligence/context/smartContextBuilder";
import { detectContextMode } from "../intelligence/context/contextMode";

export class PromptEngine {
  private scanner = new RepoScanner();
  private assembler = new PromptAssembler();
  private resolver = new IntentResolver();

  async generate(root: string, userInput: string): Promise<string> {
    // 1. Scan repository for deep insights
    const scan = await this.scanner.scan(root);

    // 2. Detect scenario from user input
    const scenario = this.resolver.resolve(userInput);

    // 3. Detect context mode (explanation, feature, bugfix, etc.)
    const mode = detectContextMode(userInput);

    // 4. Get active editor file info
    const activeEditor = vscode.window.activeTextEditor;
    const activeFilePath = activeEditor?.document.uri.fsPath;

    // 5. Score and select relevant files based on task + active file
    const relevantFiles = scoreFiles(userInput, scan.structure.classes, activeFilePath);

    // 6. Build smart context with mode awareness
    const smartContext = buildSmartContext({
      task: userInput,
      classes: scan.structure.classes,
      relevantFiles,
      activeFilePath,
      activeFileContent: activeEditor?.document.getText(),
      mode
    });

    // 7. Assemble contextual prompt with smart context
    const basePrompt = this.assembler.assemble(userInput, scan, scenario);

    return smartContext
      ? `${basePrompt}\n\n${smartContext}`
      : basePrompt;
  }
}