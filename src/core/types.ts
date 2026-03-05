/* ---------------------------------- */
/* ---------- Base Types ------------ */
/* ---------------------------------- */

export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "unknown";

export type ProjectType =
  | "node"
  | "react"
  | "python"
  | "java"
  | "unknown";

export type IntentType =
  | "feature"
  | "bugfix"
  | "refactor"
  | "testing"
  | "optimization"
  | "architecture"
  | "unknown";

/* ---------------------------------- */
/* -------- Intent Category --------- */
/* ---------------------------------- */

export enum IntentCategory {
  FEATURE = "feature",
  BUGFIX = "bugfix",
  TESTING = "testing",
  REFACTOR = "refactor",
  OPTIMIZATION = "optimization",
  DOCUMENTATION = "documentation",
  MIGRATION = "migration",
  SECURITY = "security",
  DEVOPS = "devops",
  EXPLANATION = "explanation",
  DATABASE = "database",
  REGEX = "regex",
  ACCESSIBILITY = "accessibility",
  UNKNOWN = "unknown"
}

export interface ResolvedIntent {
  category: IntentCategory;
  confidence: number;
}

/* ---------------------------------- */
/* -------- Repo Intelligence ------- */
/* ---------------------------------- */

export interface RepoFile {
  path: string;
  extension: string;
  size: number;
}

export interface RepoSummary {
  projectType: string;
  languages: string[];
  totalFiles: number;
  keyDirectories: string[];
  testDirectories: string[];
}

/* ---------------------------------- */
/* -------- Intent Layer ------------ */
/* ---------------------------------- */

export type ComplexityLevel = "low" | "medium" | "high";

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  complexity: ComplexityLevel;
}

/* ---------------------------------- */
/* -------- Prompt Engine ----------- */
/* ---------------------------------- */

export interface PromptContext {
  userInput: string;
  repoSummary?: RepoSummary;
  intent: IntentResult;
}

export interface PromptOutput {
  content: string;
  qualityScore: number;
}
