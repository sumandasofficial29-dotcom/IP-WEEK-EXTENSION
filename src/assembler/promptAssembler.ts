import { TemplateRegistry } from "../templates/templateRegistry";
import { ContextCompressor } from "../intelligence/contextCompressor";
import { RepoScanResult } from "../intelligence/repoScanner";
import { ScenarioType } from "../templates/scenarioBlueprints";

export class PromptAssembler {
  private templateRegistry = new TemplateRegistry();
  private compressor = new ContextCompressor();

  assemble(
    task: string,
    scan: RepoScanResult,
    scenario: ScenarioType
  ): string {
    const repoContext = this.compressor.compress(scan);
    const insights = scan.insights;

    const framework = insights.hasAngular
      ? "Angular"
      : insights.hasReact
      ? "React"
      : "TypeScript";

    const testFramework = insights.testFramework || "Jest";

    const template = this.templateRegistry.getTemplate(
      scenario,
      framework,
      task,
      repoContext,
      testFramework
    );

    return `
${repoContext}

${template}
`.trim();
  }
}