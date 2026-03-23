import { AnalyzedTask } from "../intelligence/taskAnalyzer";
import { TestingConfig, readProjectConfig, readTestingConfig } from "../intelligence/projectConfigReader";
import { DependencyImpact } from "../intelligence/dependencyImpactAnalyzer";
import { TestCommands } from "./smartPromptGenerator";
import { getCompanyGuidelines, hasCompanyGuidelines } from "../intelligence/companyGuidelines";

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
    hasCompanyGuidelines?: boolean;
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
      title: "Project Coding Guidelines",
      content: `## Project Coding Guidelines\nFollow these project-specific rules:\n\n${projectConfig.copilotInstructions}`,
      required: false,
      editable: true
    });
  }

  // Section 7: Company/Language-Specific Guidelines (if available)
  if (hasCompanyGuidelines(input.primaryLanguage)) {
    const guidelines = getCompanyGuidelines(input.primaryLanguage);
    if (guidelines) {
      sections.push({
        id: "companyGuidelines",
        title: "Company Coding Standards",
        content: guidelines,
        required: false,
        editable: true
      });
    }
  }

  // Section 8: Additional Context from user (if provided)
  if (input.options?.additionalContext) {
    sections.push({
      id: "additionalContext",
      title: "Additional Context",
      content: `## Additional Context\n${input.options.additionalContext}`,
      required: false,
      editable: true
    });
  }

  // Section 8b: Unit Tests (if includeTests is enabled)
  if (input.options?.includeTests) {
    const testSection = buildTestSection(input, testingConfig);
    if (testSection) {
      sections.push({
        id: "unitTests",
        title: "Unit Tests",
        content: testSection,
        required: false,
        editable: true
      });
    }
  }

  // Section 9: Requirements - what we expect from the output
  sections.push({
    id: "requirements",
    title: "Requirements",
    content: buildRequirementsSection(input, testingConfig),
    required: true,
    editable: true
  });

  // Section 10: Quality Checklist - FROM CLASSIC MODE
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
      hasDependencyAnalysis: !!(input.dependencyImpact && input.dependencyImpact.dependentFiles.length > 0),
      hasCompanyGuidelines: hasCompanyGuidelines(input.primaryLanguage)
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
  const personas: Record<string, { role: string; mindset: string }> = {
    fix:      { role: "Senior Debugging Engineer",        mindset: "You approach problems systematically: identify root cause, implement minimal fix, verify no regressions." },
    create:   { role: "Principal Software Engineer",     mindset: "You write clean, maintainable code following SOLID principles and industry best practices." },
    refactor: { role: "Senior Software Architect",       mindset: "You improve code structure while preserving behavior, focusing on readability and maintainability." },
    explain:  { role: "Technical Documentation Expert",  mindset: "You break down complex concepts into clear, digestible explanations with practical examples." },
    test:     { role: "Senior QA Engineer",              mindset: "You create comprehensive test suites covering edge cases, error conditions, and business logic." },
    review:   { role: "Code Review Specialist",          mindset: "You provide constructive, actionable feedback focusing on correctness, performance, and maintainability." },
    optimize: { role: "Performance Engineering Expert",  mindset: "You identify bottlenecks through measurement, not assumptions, and apply targeted optimizations." },
    document: { role: "Technical Writer",                mindset: "You write clear, concise documentation that helps developers understand and use the code effectively." },
    migrate:  { role: "Migration Specialist",            mindset: "You plan migrations carefully, ensuring backward compatibility and minimal disruption." },
    secure:   { role: "Security Engineer",               mindset: "You follow security best practices and consider potential attack vectors systematically." },
  };

  const { role, mindset } = personas[input.task.action] ?? personas.create;
  const techExpertise = [input.primaryLanguage, ...input.frameworks.slice(0, 3)].filter(Boolean).join(", ");
  const expertiseStr = techExpertise ? ` with deep expertise in ${techExpertise}` : "";

  return `**You are a ${role}**${expertiseStr}.

${mindset}

Think step-by-step and explain your reasoning.`;
}

/**
 * Build the unit tests section when includeTests is enabled
 */
function buildTestSection(input: FocusedPromptInput, testConfig: TestingConfig): string {
  const lines: string[] = [];

  // Detect Robot Framework: by test framework name, active .robot file, or detected frameworks list
  const isRobotFramework =
    testConfig.framework?.toLowerCase().includes("robot") ||
    input.activeFilePath?.endsWith(".robot") ||
    input.frameworks.some(f => f.toLowerCase().includes("robot"));

  lines.push("## Unit Tests");
  lines.push("Write unit tests for the above implementation:");
  lines.push("");

  if (testConfig.framework) {
    lines.push(`**Framework:** ${testConfig.framework}`);
  }
  if (testConfig.commands.length > 0) {
    lines.push(`**Run with:** \`${testConfig.commands[0]}\``);
  }

  // Robot Framework: Prerequisites before running tests
  if (isRobotFramework) {
    lines.push("");
    lines.push("**Prerequisites (must be done before running tests):**");
    lines.push("");
    lines.push("1. **Build the C++ code first:**");
    lines.push("   ```sh");
    lines.push("   bms build");
    lines.push("   ```");
    lines.push("");
    lines.push("2. **Deploy to CMK (choose one):**");
    lines.push("");
    lines.push("   - **Quick restart** (if binaries already installed):");
    lines.push("   ```sh");
    lines.push("   cmk restart");
    lines.push("   ```");
    lines.push("");
    lines.push("   - **Fresh install** (after structural changes or first deployment):");
    lines.push("   ```sh");
    lines.push("   cmk stop && cmk install && cmk start");
    lines.push("   ```");
    lines.push("");
    lines.push("3. **Then run the Robot tests:**");
    if (testConfig.commands.length > 0) {
      lines.push("   ```sh");
      lines.push(`   ${testConfig.commands[0]}`);
      lines.push("   ```");
    }
  }

  lines.push("");
  lines.push("**Requirements:**");
  lines.push("- Cover happy path and edge cases");
  lines.push("- Follow project test naming conventions");
  if (isRobotFramework) {
    lines.push("- Use Robot Framework keyword-driven style");
    lines.push("- Place test resources in the appropriate `profiles_regression/` or `regression/` folder");
  } else {
    lines.push("- Use AAA pattern (Arrange → Act → Assert)");
    lines.push("- Keep tests fast and isolated");
  }

  if (testConfig.instructions) {
    lines.push("");
    lines.push("**Test Instructions:**");
    lines.push(testConfig.instructions);
  }

  return lines.join("\n");
}

/**
 * Build requirements section - what we expect from the LLM
 */
function buildRequirementsSection(input: FocusedPromptInput, testConfig: TestingConfig): string {
  const requirements: string[] = [];
  const opts = input.options;

  // Task-specific requirements
  switch (input.task.action) {
    case "fix":
      requirements.push("1. **Identify root cause** - Explain what's causing the issue");
      requirements.push("2. **Provide fix** - Show the corrected code");
      requirements.push("3. **Explain the fix** - Why this solution works");
      if (opts?.includeTests && testConfig.commands.length > 0) {
        requirements.push(`4. **Verify** - Write a regression test and run: \`${testConfig.commands[0]}\``);
      } else if (testConfig.commands.length > 0) {
        requirements.push(`4. **Verify** - Test with: \`${testConfig.commands[0]}\``);
      }
      break;

    case "create": {
      let n = 1;
      requirements.push(`${n++}. **Implementation** - Complete, working code`);
      if (opts?.includeExplanation !== false) { requirements.push(`${n++}. **Explain approach** - Why this design was chosen`); }
      requirements.push(`${n++}. **Usage example** - How to use the new code`);
      if (opts?.includeTests) { requirements.push(`${n++}. **Unit tests** - See Unit Tests section above`); }
      break;
    }

    case "refactor":
      requirements.push("1. **Show changes** - Before/after comparison");
      requirements.push("2. **Explain improvements** - What's better and why");
      requirements.push("3. **Verify behavior** - Confirm no functionality changes");
      if (opts?.includeTests) {
        requirements.push("4. **Regression tests** - Confirm unchanged behavior with tests");
      }
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
      if (opts?.includeTests) {
        requirements.push("4. **Unit tests** - See Unit Tests section above");
      }
  }

  // Add documentation requirement (only when explicitly requested or for significant changes without the flag being set)
  const wantsDocs = opts?.includeDocumentation === true ||
    (opts?.includeDocumentation === undefined && ["create", "modify", "refactor"].includes(input.task.action));
  if (wantsDocs) {
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
