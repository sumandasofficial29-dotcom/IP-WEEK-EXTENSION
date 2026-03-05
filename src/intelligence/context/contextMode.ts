export type ContextMode =
  | "explanation"
  | "feature"
  | "bugfix"
  | "testing"
  | "refactor";

export function detectContextMode(task: string): ContextMode {
  const lower = task.toLowerCase();

  if (lower.includes("understand") || lower.includes("explain"))
    return "explanation";

  if (lower.includes("fix") || lower.includes("bug"))
    return "bugfix";

  if (lower.includes("test"))
    return "testing";

  if (lower.includes("refactor"))
    return "refactor";

  return "feature";
}
