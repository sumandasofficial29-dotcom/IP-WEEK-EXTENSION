import { ScenarioBlueprints, ScenarioType } from "./scenarioBlueprints";

export class TemplateRegistry {
  getTemplate(
    scenario: string,
    framework: string,
    task: string,
    repoContext: string,
    testFramework?: string
  ): string {
    const blueprint =
      ScenarioBlueprints[scenario as ScenarioType] ||
      ScenarioBlueprints["feature"];

    return blueprint
      .replace(/{{framework}}/g, framework)
      .replace(/{{task}}/g, task)
      .replace(/{{repoContext}}/g, repoContext)
      .replace(/{{testFramework}}/g, testFramework || "Jest");
  }
}
