import { AnalyzedTask } from "../intelligence/taskAnalyzer";
import { TestingConfig, readProjectConfig, readTestingConfig } from "../intelligence/projectConfigReader";
import { DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";
import { TestCommands } from "./smartPromptGenerator";

/**
 * Focused Prompt Generator v2 - COMBINED MODE
 * 
 * Design principles:
 * 1. CONCISE - No bloat, every word must add value
 * 2. CONTEXTUAL - Use actual project config + repo context
 * 3. ACTIONABLE - Clear, specific instructions for the LLM
 * 4. CUSTOMIZABLE - User can edit before sending
 * 5. EXPLANATION-FOCUSED - Ask for reasoning, not just code
 * 6. RICH CONTEXT - Includes folder structure, dependencies, quality checks
 */

export interface FocusedPromptInput {
  userRequest: string;
  task: AnalyzedTask;
  rootPath: string;
  activeFilePath?: string;
  activeFileContent?: string;
  primaryLanguage: string;
  frameworks: string[];
  relevantCode?: string;
  // Classic mode context
  repoContext?: string;
  codeContext?: string;
  scenario?: string;
  framework?: string;
  testFramework?: string;
  testFrameworks?: string[];
  testCommands?: TestCommands;
  dependencyImpact?: DependencyImpact;
  options?: PromptOptions;
}

export interface FocusedPromptOutput {
  prompt: string;
  sections: PromptSection[];
  editable: boolean;
  metadata: {
    estimatedTokens: number;
    hasProjectInstructions: boolean;
    hasTestInstructions: boolean;
    hasRepoContext?: boolean;
    hasDependencyAnalysis?: boolean;
  };
}

export interface PromptSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  editable: boolean;
}

/**
 * Generate a focused, value-adding prompt with FULL repo context
 * Combines classic mode's rich context with focused mode's clarity
 */
export function generateFocusedPrompt(input: FocusedPromptInput): FocusedPromptOutput {
  const projectConfig = readProjectConfig(input.rootPath);
  const testingConfig = readTestingConfig(input.rootPath);
  
  const sections: PromptSection[] = [];
  
  // Section 1: Role Assignment (LLM-friendly expert persona)
  sections.push({
    id: "role",
    title: "Role",
    content: buildRoleSection(input),
    required: true,
    editable: false
  });
  
  // Section 2: Task (always required, very concise)
  sections.push({
    id: "task",
    title: "Task",
    content: buildTaskSection(input),
    required: true,
    editable: true
  });

  // Section 3: Repository Context (folder structure, tech stack) - FROM CLASSIC MODE
  if (input.repoContext) {
    sections.push({
      id: "repoContext",
      title: "Repository Context",
      content: `## Repository Context\n${input.repoContext}`,
      required: false,
      editable: false
    });
  }

  // Section 4: Relevant Code Context - FROM CLASSIC MODE
  if (input.codeContext) {
    sections.push({
      id: "codeContext",
      title: "Relevant Code",
      content: `## Relevant Code\n${input.codeContext}`,
      required: false,
      editable: false
    });
  }

  // Section 5: Dependency Impact Analysis - FROM CLASSIC MODE
  if (input.dependencyImpact && input.dependencyImpact.dependentFiles.length > 0) {
    sections.push({
      id: "dependencies",
      title: "Dependency Impact",
      content: buildDependencySection(input.dependencyImpact),
      required: false,
      editable: false
    });
  }

  // Section 6: Project Instructions (if copilot-instructions.md exists)
  if (projectConfig.copilotInstructions) {
    sections.push({
      id: "instructions",
      title: "Project Instructions",
      content: projectConfig.copilotInstructions,
      required: false,
      editable: true
    });
  }

  // Section 7: Additional Context from user (if provided)
  if (input.options?.additionalContext) {
    sections.push({
      id: "additionalContext",
      title: "Additional Context",
      content: `## Additional Context\n${input.options.additionalContext}`,
      required: false,
      editable: true
    });
  }

  // Section 8: Requirements - what we expect from the output
  sections.push({
    id: "requirements",
    title: "Requirements",
    content: buildRequirementsSection(input, testingConfig),
    required: true,
    editable: true
  });

  // Section 9: Quality Checklist - FROM CLASSIC MODE
  sections.push({
    id: "quality",
    title: "Quality Checklist",
    content: buildQualityChecklist(input),
    required: false,
    editable: false
  });

  // Combine all sections
  const prompt = sections
    .filter(s => s.content.trim().length > 0)
    .map(s => s.content)
    .join("\n\n---\n\n");

  return {
    prompt,
    sections,
    editable: true,
    metadata: {
      estimatedTokens: Math.ceil(prompt.length / 4),
      hasProjectInstructions: !!projectConfig.copilotInstructions,
      hasTestInstructions: testingConfig.commands.length > 0,
      hasRepoContext: !!input.repoContext,
      hasDependencyAnalysis: !!(input.dependencyImpact && input.dependencyImpact.dependentFiles.length > 0)
    }
  };
}

/**
 * Build dependency impact section - FROM CLASSIC MODE
 */
function buildDependencySection(impact: DependencyImpact): string {
  const parts: string[] = [];
  parts.push("## Dependency Impact Analysis");
  parts.push(`**Impact Level:** ${impact.impactLevel.toUpperCase()}`);
  
  if (impact.dependentFiles.length > 0) {
    parts.push("\n**Files that depend on this:**");
    impact.dependentFiles.slice(0, 10).forEach((dep) => {
      parts.push(`- \`${dep.relativePath}\``);
    });
    if (impact.dependentFiles.length > 10) {
      parts.push(`- ... and ${impact.dependentFiles.length - 10} more files`);
    }
  }
  
  if (impact.warnings.length > 0) {
    parts.push("\n**Warnings:**");
    impact.warnings.forEach((w: string) => {
      parts.push(`- ${w}`);
    });
  }
  
  if (impact.summary) {
    parts.push(`\n**Summary:** ${impact.summary}`);
  }
  
  return parts.join("\n");
}

/**
 * Build quality checklist - FROM CLASSIC MODE
 */
function buildQualityChecklist(input: FocusedPromptInput): string {
  const items: string[] = [];
  
  items.push("## Quality Checklist");
  items.push("Before finalizing, verify:");
  items.push("- [ ] Code follows project conventions");
  items.push("- [ ] No breaking changes to public APIs");
  items.push("- [ ] Error handling is comprehensive");
  
  if (input.dependencyImpact && input.dependencyImpact.dependentFiles.length > 0) {
    items.push("- [ ] Changes are compatible with dependent files");
  }
  
  if (input.task.action === "refactor") {
    items.push("- [ ] Behavior is preserved (no functional changes)");
  }
  
  if (["create", "fix", "modify"].includes(input.task.action)) {
    items.push("- [ ] Edge cases are handled");
    items.push("- [ ] Code is self-documenting with clear names");
  }
  
  return items.join("\n");
}

/**
 * Build the task section - concise and clear
 */
function buildTaskSection(input: FocusedPromptInput): string {
  const parts: string[] = [];
  
  // Clear action statement
  parts.push(`**${input.task.action.toUpperCase()}:** ${input.userRequest}`);
  
  // File context if available
  if (input.activeFilePath) {
    const fileName = input.activeFilePath.split(/[/\\]/).pop();
    parts.push(`**File:** \`${fileName}\``);
  }
  
  // Tech stack context (one line, not a wall of text)
  const tech = [input.primaryLanguage, ...input.frameworks.slice(0, 2)].filter(Boolean).join(", ");
  if (tech) {
    parts.push(`**Stack:** ${tech}`);
  }
  
  return parts.join("\n");
}

/**
 * Build the role section - LLM-friendly expert persona
 */
function buildRoleSection(input: FocusedPromptInput): string {
  // Map task action to appropriate expert role
  const roleMap: Record<string, string> = {
    "fix": "Senior Debugging Engineer",
    "create": "Principal Software Engineer",
    "refactor": "Senior Software Architect",
    "explain": "Technical Documentation Expert",
    "test": "Senior QA Engineer",
    "review": "Code Review Specialist",
    "optimize": "Performance Engineering Expert",
    "document": "Technical Writer",
    "migrate": "Migration Specialist",
    "secure": "Security Engineer"
  };
  
  const role = roleMap[input.task.action] || "Principal Software Engineer";
  
  // Build tech expertise
  const techExpertise = [input.primaryLanguage, ...input.frameworks.slice(0, 3)]
    .filter(Boolean)
    .join(", ");
  
  const expertiseStr = techExpertise ? ` with deep expertise in ${techExpertise}` : "";
  
  // Action-specific mindset
  const mindsetMap: Record<string, string> = {
    "fix": "You approach problems systematically: identify root cause, implement minimal fix, verify no regressions.",
    "create": "You write clean, maintainable code following SOLID principles and industry best practices.",
    "refactor": "You improve code structure while preserving behavior, focusing on readability and maintainability.",
    "explain": "You break down complex concepts into clear, digestible explanations with practical examples.",
    "test": "You create comprehensive test suites covering edge cases, error conditions, and business logic.",
    "review": "You provide constructive, actionable feedback focusing on correctness, performance, and maintainability.",
    "optimize": "You identify bottlenecks through measurement, not assumptions, and apply targeted optimizations.",
    "document": "You write clear, concise documentation that helps developers understand and use the code effectively.",
    "migrate": "You plan migrations carefully, ensuring backward compatibility and minimal disruption.",
    "secure": "You follow security best practices and consider potential attack vectors systematically."
  };
  
  const mindset = mindsetMap[input.task.action] || mindsetMap["create"];
  
  return `**You are a ${role}**${expertiseStr}.

${mindset}

Think step-by-step and explain your reasoning.`;
}

/**
 * Build requirements section - what we expect from the LLM
 */
function buildRequirementsSection(input: FocusedPromptInput, testConfig: TestingConfig): string {
  const requirements: string[] = [];
  
  // Task-specific requirements
  switch (input.task.action) {
    case "fix":
      requirements.push("1. **Identify root cause** - Explain what's causing the issue");
      requirements.push("2. **Provide fix** - Show the corrected code");
      requirements.push("3. **Explain the fix** - Why this solution works");
      if (testConfig.commands.length > 0) {
        requirements.push(`4. **Verify** - Test with: \`${testConfig.commands[0]}\``);
      }
      break;
      
    case "create":
      requirements.push("1. **Implementation** - Complete, working code");
      requirements.push("2. **Explain approach** - Why this design was chosen");
      requirements.push("3. **Usage example** - How to use the new code");
      break;
      
    case "refactor":
      requirements.push("1. **Show changes** - Before/after comparison");
      requirements.push("2. **Explain improvements** - What's better and why");
      requirements.push("3. **Verify behavior** - Confirm no functionality changes");
      break;
      
    case "explain":
      requirements.push("1. **Overview** - What does this code do (2-3 sentences)");
      requirements.push("2. **Step-by-step** - Walk through the key parts");
      requirements.push("3. **Key insights** - Important things to understand");
      break;
      
    case "test":
      requirements.push("1. **Test cases** - Cover happy path and edge cases");
      requirements.push("2. **Test structure** - Using project's test framework");
      if (testConfig.framework) {
        requirements.push(`3. **Framework** - Use ${testConfig.framework}`);
      }
      break;
      
    default:
      requirements.push("1. **Solution** - Complete implementation");
      requirements.push("2. **Explanation** - Step-by-step reasoning");
      requirements.push("3. **Code comments** - Document key decisions");
  }
  
  // Add documentation requirement for significant changes
  if (["create", "modify", "refactor"].includes(input.task.action)) {
    requirements.push("");
    requirements.push("**Documentation:** Add appropriate code comments/docstrings explaining:");
    requirements.push("- Purpose of functions/classes");
    requirements.push("- Parameters and return values");
    requirements.push("- Any important side effects");
  }
  
  return requirements.join("\n");
}

/**
 * Generate prompt with user customization options
 * NOTE: No code included - Copilot already sees the active file
 */
export interface PromptOptions {
  includeExplanation: boolean;
  includeDocumentation: boolean;
  includeTests: boolean;
  includeProjectInstructions: boolean;
  additionalContext?: string;
}

export function generateCustomPrompt(
  input: FocusedPromptInput, 
  options: PromptOptions
): string {
  const projectConfig = readProjectConfig(input.rootPath);
  const testingConfig = readTestingConfig(input.rootPath);
  
  const parts: string[] = [];
  
  // Role (expert persona)
  parts.push(buildRoleSection(input));
  
  // Task (always included)
  parts.push("\n---\n");
  parts.push(buildTaskSection(input));
  
  // Project instructions (optional)
  if (options.includeProjectInstructions && projectConfig.copilotInstructions) {
    parts.push("\n---\n");
    parts.push("## Project Guidelines");
    parts.push(projectConfig.copilotInstructions);
  }
  
  // Additional context from user
  if (options.additionalContext) {
    parts.push("\n---\n");
    parts.push("## Additional Context");
    parts.push(options.additionalContext);
  }
  
  // Requirements
  parts.push("\n---\n");
  parts.push("## Output Requirements");
  
  const reqs: string[] = [];
  reqs.push("1. Provide complete, working implementation");
  
  if (options.includeExplanation) {
    reqs.push("2. **Explain your changes step-by-step** - What you changed and why");
  }
  
  if (options.includeDocumentation) {
    reqs.push("3. **Add documentation** - Include JSDoc/docstrings for all public functions");
  }
  
  if (options.includeTests && testingConfig.commands.length > 0) {
    reqs.push(`4. **Include tests** - Write tests using the project's test framework`);
    reqs.push(`   Run with: \`${testingConfig.commands.join("` or `")}\``);
  }
  
  parts.push(reqs.join("\n"));
  
  return parts.join("\n");
}

/**
 * Get default options based on task type
 */
export function getDefaultOptions(task: AnalyzedTask): PromptOptions {
  const defaults: PromptOptions = {
    includeExplanation: true,  // Always explain changes
    includeDocumentation: false,
    includeTests: false,
    includeProjectInstructions: true
  };
  
  switch (task.action) {
    case "fix":
      defaults.includeExplanation = true;
      defaults.includeTests = true;  // Bug fixes should include regression tests
      break;
    case "create":
      defaults.includeDocumentation = true;
      defaults.includeTests = true;
      break;
    case "refactor":
      defaults.includeExplanation = true;
      defaults.includeTests = true;  // Verify behavior unchanged
      break;
    case "test":
      defaults.includeDocumentation = false;
      defaults.includeTests = false;  // Already creating tests
      break;
    case "explain":
      defaults.includeExplanation = false;  // It's the whole point
      defaults.includeDocumentation = false;
      defaults.includeTests = false;
      break;
  }
  
  return defaults;
}
