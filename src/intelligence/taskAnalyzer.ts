/**
 * Smart Task Analyzer
 * 
 * Deeply understands user intent to generate precise, targeted prompts.
 * Extracts: action, target, constraints, expected outcome, and context clues.
 */

export interface AnalyzedTask {
  // Core intent
  action: TaskAction;
  actionVerb: string;
  
  // What to work on
  target: TaskTarget;
  
  // Additional requirements
  constraints: string[];
  expectedOutcome?: string;
  
  // Context clues from user input
  mentionedFiles: string[];
  mentionedClasses: string[];
  mentionedMethods: string[];
  mentionedConcepts: string[];
  
  // Issue tracking
  issueType?: IssueType;
  errorMessage?: string;
  currentBehavior?: string;
  expectedBehavior?: string;
  
  // Complexity assessment
  complexity: "simple" | "moderate" | "complex";
  estimatedScope: "single-file" | "multi-file" | "cross-module";
  
  // Original input
  originalInput: string;
  normalizedInput: string;
}

export type TaskAction = 
  | "create"      // Build new functionality
  | "modify"      // Change existing code
  | "fix"         // Resolve a bug/issue
  | "refactor"    // Improve without changing behavior
  | "delete"      // Remove functionality
  | "explain"     // Understand code
  | "test"        // Add/update tests
  | "document"    // Add documentation
  | "optimize"    // Improve performance
  | "migrate"     // Move/upgrade
  | "debug"       // Find issue root cause
  | "review";     // Code review

export interface TaskTarget {
  type: "component" | "service" | "function" | "class" | "file" | "module" | "feature" | "api" | "test" | "unknown";
  name?: string;
  filePath?: string;
  description: string;
}

export type IssueType =
  | "bug"           // Something broken
  | "error"         // Runtime/compile error
  | "performance"   // Slow/inefficient
  | "security"      // Vulnerability
  | "ux"            // User experience issue
  | "logic"         // Wrong behavior
  | "integration"   // External system issue
  | "data";         // Data handling issue

// Action detection patterns
const ACTION_PATTERNS: { pattern: RegExp; action: TaskAction; verb: string }[] = [
  // Creation
  { pattern: /\b(create|add|implement|build|make|generate|write|develop|introduce)\b/i, action: "create", verb: "create" },
  { pattern: /\bnew\s+(component|service|feature|function|class|module)/i, action: "create", verb: "create" },
  
  // Modification
  { pattern: /\b(update|change|modify|edit|alter|adjust|tweak)\b/i, action: "modify", verb: "modify" },
  
  // Fixing
  { pattern: /\b(fix|resolve|repair|patch|correct|solve)\b/i, action: "fix", verb: "fix" },
  { pattern: /\b(bug|issue|problem|broken|not working|doesn't work|fails)\b/i, action: "fix", verb: "fix" },
  
  // Refactoring
  { pattern: /\b(refactor|restructure|reorganize|clean\s*up|simplify|improve\s+code)\b/i, action: "refactor", verb: "refactor" },
  
  // Deletion
  { pattern: /\b(remove|delete|drop|eliminate|get\s+rid\s+of)\b/i, action: "delete", verb: "remove" },
  
  // Explanation
  { pattern: /\b(explain|understand|how\s+does|what\s+does|describe|walk\s+through)\b/i, action: "explain", verb: "explain" },
  { pattern: /\bwhy\s+(is|does|did)\b/i, action: "explain", verb: "explain" },
  
  // Testing
  { pattern: /\b(test|spec|unit\s+test|integration\s+test|e2e|coverage)\b/i, action: "test", verb: "test" },
  
  // Documentation
  { pattern: /\b(document|docs|readme|comment|jsdoc|tsdoc)\b/i, action: "document", verb: "document" },
  
  // Optimization
  { pattern: /\b(optimize|speed\s+up|improve\s+performance|make\s+faster|reduce\s+memory)\b/i, action: "optimize", verb: "optimize" },
  
  // Migration
  { pattern: /\b(migrate|upgrade|move\s+to|convert|transition|port)\b/i, action: "migrate", verb: "migrate" },
  
  // Debugging
  { pattern: /\b(debug|trace|find\s+the\s+issue|investigate|diagnose)\b/i, action: "debug", verb: "debug" },
  
  // Review
  { pattern: /\b(review|check|audit|assess|evaluate)\b/i, action: "review", verb: "review" },
];

// Target type patterns
const TARGET_PATTERNS: { pattern: RegExp; type: TaskTarget["type"] }[] = [
  { pattern: /\b(\w+)\.component\.(ts|html|css|scss)/i, type: "component" },
  { pattern: /\b(\w+)\.service\.ts/i, type: "service" },
  { pattern: /\b(\w+)\.module\.ts/i, type: "module" },
  { pattern: /\bcomponent\b/i, type: "component" },
  { pattern: /\bservice\b/i, type: "service" },
  { pattern: /\bmodule\b/i, type: "module" },
  { pattern: /\bfunction\s+(\w+)/i, type: "function" },
  { pattern: /\bmethod\s+(\w+)/i, type: "function" },
  { pattern: /\bclass\s+(\w+)/i, type: "class" },
  { pattern: /\b(\w+)\.(ts|js|tsx|jsx)\b/i, type: "file" },
  { pattern: /\bapi|endpoint|route\b/i, type: "api" },
  { pattern: /\btest|spec\b/i, type: "test" },
  { pattern: /\bfeature\b/i, type: "feature" },
];

// Issue type patterns
const ISSUE_PATTERNS: { pattern: RegExp; type: IssueType }[] = [
  { pattern: /\b(bug|broken|not working|doesn't work|fails|crash)\b/i, type: "bug" },
  { pattern: /\b(error|exception|throw|undefined|null pointer)\b/i, type: "error" },
  { pattern: /\b(slow|performance|lag|memory|leak|optimize)\b/i, type: "performance" },
  { pattern: /\b(security|vulnerability|xss|injection|auth)\b/i, type: "security" },
  { pattern: /\b(ux|ui|user experience|usability|confusing)\b/i, type: "ux" },
  { pattern: /\b(wrong|incorrect|should|expected|instead)\b/i, type: "logic" },
  { pattern: /\b(integration|api|external|third.party|connection)\b/i, type: "integration" },
  { pattern: /\b(data|database|storage|cache|state)\b/i, type: "data" },
];

/**
 * Analyzes user input to extract structured task information
 */
export function analyzeTask(userInput: string, activeFilePath?: string): AnalyzedTask {
  const input = userInput.trim();
  const lowerInput = input.toLowerCase();
  
  // Detect action
  const { action, verb } = detectAction(lowerInput);
  
  // Detect target
  const target = detectTarget(input, activeFilePath);
  
  // Extract mentioned identifiers
  const mentionedFiles = extractFileNames(input);
  const mentionedClasses = extractClassNames(input);
  const mentionedMethods = extractMethodNames(input);
  const mentionedConcepts = extractConcepts(input);
  
  // Extract constraints from input
  const constraints = extractConstraints(input);
  
  // Detect issue details if fixing/debugging
  const issueType = detectIssueType(lowerInput);
  const { errorMessage, currentBehavior, expectedBehavior } = extractIssueDetails(input);
  
  // Extract expected outcome
  const expectedOutcome = extractExpectedOutcome(input);
  
  // Assess complexity
  const complexity = assessComplexity(input, mentionedFiles, mentionedClasses);
  const estimatedScope = assessScope(input, mentionedFiles);
  
  // Normalize input for better processing
  const normalizedInput = normalizeInput(input, action, target);
  
  return {
    action,
    actionVerb: verb,
    target,
    constraints,
    expectedOutcome,
    mentionedFiles,
    mentionedClasses,
    mentionedMethods,
    mentionedConcepts,
    issueType,
    errorMessage,
    currentBehavior,
    expectedBehavior,
    complexity,
    estimatedScope,
    originalInput: input,
    normalizedInput
  };
}

function detectAction(input: string): { action: TaskAction; verb: string } {
  for (const { pattern, action, verb } of ACTION_PATTERNS) {
    if (pattern.test(input)) {
      return { action, verb };
    }
  }
  return { action: "create", verb: "implement" }; // Default
}

function detectTarget(input: string, activeFilePath?: string): TaskTarget {
  // Try to find specific target type
  for (const { pattern, type } of TARGET_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      return {
        type,
        name: match[1] || undefined,
        filePath: activeFilePath,
        description: extractTargetDescription(input, type)
      };
    }
  }
  
  // Check if active file gives us context
  if (activeFilePath) {
    if (activeFilePath.includes(".component.")) {
      return { type: "component", filePath: activeFilePath, description: extractTargetDescription(input, "component") };
    }
    if (activeFilePath.includes(".service.")) {
      return { type: "service", filePath: activeFilePath, description: extractTargetDescription(input, "service") };
    }
  }
  
  return { type: "unknown", description: input.substring(0, 100) };
}

function extractTargetDescription(input: string, _type: string): string {
  // Remove action words to get description
  return input
    .replace(/\b(create|add|implement|fix|update|refactor|delete|explain|test)\b/gi, "")
    .replace(/\b(the|a|an)\b/gi, "")
    .trim()
    .substring(0, 150);
}

function extractFileNames(input: string): string[] {
  const patterns = [
    /[\w-]+\.(ts|js|tsx|jsx|html|css|scss|json|yaml|yml)\b/gi,
    /[\w-]+\.(component|service|module|directive|pipe|guard)\.(ts|html|css|scss)/gi,
  ];
  
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = input.match(pattern) || [];
    files.push(...matches);
  }
  return [...new Set(files)];
}

function extractClassNames(input: string): string[] {
  const patterns = [
    /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g,  // PascalCase
    /class\s+(\w+)/gi,
    /interface\s+(\w+)/gi,
  ];
  
  const classes: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      if (match[1] && !["Http", "JSON", "API", "URL", "HTML", "CSS"].includes(match[1])) {
        classes.push(match[1]);
      }
    }
  }
  return [...new Set(classes)];
}

function extractMethodNames(input: string): string[] {
  const patterns = [
    /\b(\w+)\s*\(\)/g,           // functionName()
    /method\s+(\w+)/gi,          // method xyz
    /function\s+(\w+)/gi,        // function xyz
    /\.(\w+)\s*\(/g,             // .methodName(
  ];
  
  const methods: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      if (match[1] && match[1].length > 2) {
        methods.push(match[1]);
      }
    }
  }
  return [...new Set(methods)];
}

function extractConcepts(input: string): string[] {
  const conceptPatterns = [
    /\b(authentication|authorization|validation|pagination|caching|logging|routing|state management)\b/gi,
    /\b(form|modal|dialog|table|list|grid|chart|dashboard)\b/gi,
    /\b(http|api|rest|graphql|websocket|socket)\b/gi,
    /\b(rxjs|observable|promise|async|await)\b/gi,
    /\b(dependency injection|di|singleton|factory|observer)\b/gi,
  ];
  
  const concepts: string[] = [];
  for (const pattern of conceptPatterns) {
    const matches = input.match(pattern) || [];
    concepts.push(...matches.map(m => m.toLowerCase()));
  }
  return [...new Set(concepts)];
}

function extractConstraints(input: string): string[] {
  const constraints: string[] = [];
  const lower = input.toLowerCase();
  
  // Explicit constraints
  if (lower.includes("without") || lower.includes("don't") || lower.includes("shouldn't")) {
    const negativeMatch = input.match(/(?:without|don't|shouldn't|must not|should not)\s+([^,.]+)/i);
    if (negativeMatch) constraints.push(`Avoid: ${negativeMatch[1].trim()}`);
  }
  
  if (lower.includes("must") || lower.includes("should") || lower.includes("need to")) {
    const positiveMatch = input.match(/(?:must|should|need to)\s+([^,.]+)/i);
    if (positiveMatch) constraints.push(`Must: ${positiveMatch[1].trim()}`);
  }
  
  // Framework constraints
  if (lower.includes("angular")) constraints.push("Follow Angular conventions");
  if (lower.includes("react")) constraints.push("Follow React patterns");
  if (lower.includes("typescript")) constraints.push("Use strict TypeScript");
  if (lower.includes("accessibility") || lower.includes("a11y")) constraints.push("Ensure accessibility");
  if (lower.includes("responsive")) constraints.push("Make responsive");
  if (lower.includes("backward compatible")) constraints.push("Maintain backward compatibility");
  
  return constraints;
}

function detectIssueType(input: string): IssueType | undefined {
  for (const { pattern, type } of ISSUE_PATTERNS) {
    if (pattern.test(input)) {
      return type;
    }
  }
  return undefined;
}

function extractIssueDetails(input: string): {
  errorMessage?: string;
  currentBehavior?: string;
  expectedBehavior?: string;
} {
  // Extract error message
  const errorMatch = input.match(/error[:\s]+["']?([^"'\n]+)["']?/i) ||
                     input.match(/["']([^"']*error[^"']*)["']/i);
  
  // Extract current vs expected behavior
  const currentMatch = input.match(/(?:currently|now|it)\s+([^,.]+(?:but|instead)[^,.]*)/i) ||
                       input.match(/(?:shows?|displays?|returns?)\s+([^,.]+)/i);
  
  const expectedMatch = input.match(/(?:should|expected|want|need)\s+(?:to\s+)?([^,.]+)/i) ||
                        input.match(/(?:instead of|rather than)\s+([^,.]+)/i);
  
  return {
    errorMessage: errorMatch?.[1]?.trim(),
    currentBehavior: currentMatch?.[1]?.trim(),
    expectedBehavior: expectedMatch?.[1]?.trim()
  };
}

function extractExpectedOutcome(input: string): string | undefined {
  const outcomePatterns = [
    /so that\s+(.+)/i,
    /in order to\s+(.+)/i,
    /to achieve\s+(.+)/i,
    /the result should be\s+(.+)/i,
  ];
  
  for (const pattern of outcomePatterns) {
    const match = input.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function assessComplexity(
  input: string,
  files: string[],
  classes: string[]
): "simple" | "moderate" | "complex" {
  const wordCount = input.split(/\s+/).length;
  const hasMultipleTargets = files.length > 1 || classes.length > 1;
  const hasIntegration = /integration|multiple|several|across|between/i.test(input);
  const hasMigration = /migrate|upgrade|convert/i.test(input);
  
  if (hasMigration || (hasMultipleTargets && hasIntegration)) return "complex";
  if (wordCount > 30 || hasMultipleTargets) return "moderate";
  return "simple";
}

function assessScope(
  input: string,
  files: string[]
): "single-file" | "multi-file" | "cross-module" {
  if (files.length > 2 || /across|multiple modules|several files/i.test(input)) {
    return "cross-module";
  }
  if (files.length > 1 || /files|components|services/i.test(input)) {
    return "multi-file";
  }
  return "single-file";
}

function normalizeInput(input: string, action: TaskAction, target: TaskTarget): string {
  // Create a clear, structured version of the task
  const parts: string[] = [];
  
  parts.push(`${action.toUpperCase()}`);
  
  if (target.type !== "unknown") {
    parts.push(`[${target.type}]`);
  }
  
  if (target.name) {
    parts.push(target.name);
  }
  
  parts.push("-", target.description || input.substring(0, 100));
  
  return parts.join(" ");
}

/**
 * Generates a structured task summary for the LLM
 */
export function formatTaskForLLM(task: AnalyzedTask): string {
  const parts: string[] = [];
  
  // Primary instruction
  parts.push(`## Task: ${task.actionVerb.toUpperCase()} ${task.target.type}`);
  if (task.target.name) {
    parts.push(`**Target:** ${task.target.name}`);
  }
  
  // Original request
  parts.push(`\n### User Request\n${task.originalInput}`);
  
  // Issue details if debugging/fixing
  if (task.issueType) {
    parts.push(`\n### Issue Analysis`);
    parts.push(`- **Type:** ${task.issueType}`);
    if (task.errorMessage) parts.push(`- **Error:** ${task.errorMessage}`);
    if (task.currentBehavior) parts.push(`- **Current:** ${task.currentBehavior}`);
    if (task.expectedBehavior) parts.push(`- **Expected:** ${task.expectedBehavior}`);
  }
  
  // Referenced code elements
  if (task.mentionedClasses.length || task.mentionedMethods.length || task.mentionedFiles.length) {
    parts.push(`\n### Referenced Code`);
    if (task.mentionedFiles.length) parts.push(`- Files: ${task.mentionedFiles.join(", ")}`);
    if (task.mentionedClasses.length) parts.push(`- Classes: ${task.mentionedClasses.join(", ")}`);
    if (task.mentionedMethods.length) parts.push(`- Methods: ${task.mentionedMethods.join(", ")}`);
  }
  
  // Constraints
  if (task.constraints.length) {
    parts.push(`\n### Constraints`);
    task.constraints.forEach(c => parts.push(`- ${c}`));
  }
  
  // Expected outcome
  if (task.expectedOutcome) {
    parts.push(`\n### Expected Outcome\n${task.expectedOutcome}`);
  }
  
  // Scope
  parts.push(`\n### Scope`);
  parts.push(`- **Complexity:** ${task.complexity}`);
  parts.push(`- **Scope:** ${task.estimatedScope}`);
  
  return parts.join("\n");
}
