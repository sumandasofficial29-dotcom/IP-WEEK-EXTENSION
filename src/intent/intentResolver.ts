import { ScenarioType } from "../templates/scenarioBlueprints";

export function resolveIntent(prompt: string): ScenarioType {
  const lower = prompt.toLowerCase();

  if (lower.includes("fix") || lower.includes("error") || lower.includes("bug"))
    return "bugfix";

  if (lower.includes("test") || lower.includes("spec"))
    return "testing";

  if (lower.includes("refactor") || lower.includes("cleanup"))
    return "refactor";

  if (lower.includes("optimize") || lower.includes("performance"))
    return "optimization";

  if (lower.includes("explain") || lower.includes("what does") || lower.includes("how does"))
    return "explanation";

  if (lower.includes("convert") || lower.includes("migrate") || lower.includes("upgrade"))
    return "migration";

  if (lower.includes("document") || lower.includes("readme") || lower.includes("comment"))
    return "documentation";

  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("schema"))
    return "database";

  if (lower.includes("docker") || lower.includes("ci") || lower.includes("pipeline") || lower.includes("deploy"))
    return "devops";

  if (lower.includes("regex") || lower.includes("regular expression"))
    return "regex";

  if (lower.includes("accessibility") || lower.includes("aria") || lower.includes("a11y"))
    return "accessibility";

  if (lower.includes("secure") || lower.includes("auth") || lower.includes("encrypt") || lower.includes("xss"))
    return "security";

  if (lower.includes("prototype") || lower.includes("poc") || lower.includes("quick"))
    return "prototype";

  if (lower.includes("review") || lower.includes("check"))
    return "review";

  if (lower.includes("commit") || lower.includes("message"))
    return "commit";

  if (lower.includes("learn") || lower.includes("teach") || lower.includes("tutorial"))
    return "learning";

  if (lower.includes("pseudocode") || lower.includes("algorithm"))
    return "pseudocode";

  if (lower.includes("pair") || lower.includes("together"))
    return "pair";

  if (lower.includes("data") || lower.includes("transform") || lower.includes("parse"))
    return "data";

  return "feature";
}

export class IntentResolver {
  resolve(input: string): ScenarioType {
    return resolveIntent(input);
  }
}
