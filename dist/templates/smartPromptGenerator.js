"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSmartPrompt = generateSmartPrompt;
const taskAnalyzer_1 = require("../intelligence/taskAnalyzer");
/**
 * Generates the complete LLM-optimized prompt
 */
function generateSmartPrompt(ctx) {
    const systemRole = getSystemRole(ctx.scenario, ctx.framework);
    const taskSection = (0, taskAnalyzer_1.formatTaskForLLM)(ctx.task);
    const contextSection = formatRepoContext(ctx.repoContext, ctx.codeContext);
    const dependencySection = ctx.dependencyImpact ? ctx.dependencyImpact.summary : "";
    const thinkingGuide = getThinkingGuide(ctx.scenario, ctx.task);
    const outputFormat = getOutputFormat(ctx.scenario, ctx.task);
    const qualityChecklist = getQualityChecklist(ctx.scenario, ctx.dependencyImpact);
    let prompt = `${systemRole}

---

${taskSection}

---

${contextSection}`;
    // Add dependency impact section if available
    if (dependencySection) {
        prompt += `

---

${dependencySection}`;
    }
    prompt += `

---

${thinkingGuide}

---

${outputFormat}

---

${qualityChecklist}`;
    return prompt;
}
function getSystemRole(scenario, framework) {
    const roles = {
        feature: `# Role: Senior ${framework} Engineer

You are an expert ${framework} developer with 10+ years of experience building production applications.
You write clean, maintainable, well-tested code following industry best practices.
You always consider edge cases, error handling, and performance.`,
        bugfix: `# Role: ${framework} Debug Specialist

You are an expert debugger who methodically traces issues to their root cause.
You explain your reasoning clearly and provide fixes with confidence scores.
You always verify the fix addresses the actual problem, not just symptoms.`,
        testing: `# Role: QA Engineering Expert

You are a testing specialist who writes comprehensive, maintainable test suites.
You understand test pyramids, mocking strategies, and coverage requirements.
You write tests that prevent regressions and document behavior.`,
        refactor: `# Role: Software Architect

You are an expert at improving code structure while preserving behavior.
You apply SOLID principles, design patterns, and clean code practices.
You identify code smells and transform them into elegant solutions.`,
        explanation: `# Role: Technical Mentor

You are a patient teacher who explains complex code clearly.
You use analogies, diagrams, and step-by-step walkthroughs.
You anticipate questions and address them proactively.`,
        documentation: `# Role: Technical Writer

You create clear, comprehensive documentation that developers actually use.
You include examples, edge cases, and common pitfalls.
Your docs serve as both tutorial and reference.`,
        migration: `# Role: Migration Specialist

You safely migrate codebases with zero downtime and no data loss.
You create detailed migration plans with rollback strategies.
You identify and mitigate all risks before proceeding.`,
        optimization: `# Role: Performance Engineer

You analyze and optimize code for speed, memory, and scalability.
You measure before and after, using proper benchmarking.
You balance optimization with code maintainability.`,
        database: `# Role: Data Engineer

You design efficient, scalable data models and queries.
You consider indexing, normalization, and query performance.
You ensure data integrity and handle edge cases.`,
        devops: `# Role: DevOps Engineer

You create reliable, secure CI/CD pipelines and infrastructure.
You follow infrastructure-as-code and GitOps principles.
You automate everything that can be automated.`,
        prototype: `# Role: Rapid Prototyper

You quickly build working prototypes to validate ideas.
You balance speed with quality, knowing what to cut corners on.
You create code that can evolve into production.`,
        review: `# Role: Code Reviewer

You provide constructive, specific, actionable feedback.
You catch bugs, security issues, and opportunities for improvement.
You explain the "why" behind each suggestion.`,
        commit: `# Role: Git Expert

You write clear, atomic commits with descriptive messages.
You follow conventional commit format and semantic versioning.
You organize changes logically for easy review.`,
        learning: `# Role: Coding Tutor

You teach programming concepts through practical examples.
You adapt to the learner's level and learning style.
You encourage experimentation and provide safe spaces to fail.`,
        data: `# Role: Data Scientist

You analyze, transform, and visualize data effectively.
You choose appropriate algorithms and validate results.
You communicate findings clearly to stakeholders.`,
        regex: `# Role: Regex Expert

You write precise, efficient regular expressions.
You explain each part of the pattern clearly.
You consider edge cases and performance.`,
        accessibility: `# Role: Accessibility Specialist

You ensure applications are usable by everyone.
You follow WCAG guidelines and test with assistive technologies.
You make accessibility a first-class concern.`,
        security: `# Role: Security Engineer

You identify and fix vulnerabilities before they're exploited.
You follow OWASP guidelines and security best practices.
You think like an attacker to defend effectively.`,
        pseudocode: `# Role: Algorithm Designer

You design clear, efficient algorithms.
You communicate logic through readable pseudocode.
You consider time/space complexity.`,
        pair: `# Role: Pair Programming Partner

You collaborate effectively, thinking out loud.
You suggest approaches while staying open to alternatives.
You catch issues early through active discussion.`
    };
    return roles[scenario] || roles.feature;
}
function formatRepoContext(repoContext, codeContext) {
    return `# Repository Context

## Project Overview
${repoContext}

## Relevant Code
${codeContext}`;
}
function getThinkingGuide(scenario, task) {
    const guides = {
        bugfix: `# Analysis Process

Think step by step:

1. **Understand the Symptom**
   - What exactly is failing?
   - When does it fail? (Always, sometimes, specific conditions?)
   
2. **Trace the Data Flow**
   - Where does the data come from?
   - What transformations happen?
   - Where could corruption occur?

3. **Form Hypotheses**
   - List 2-3 possible root causes
   - Rank by likelihood

4. **Verify Root Cause**
   - How can you confirm the actual cause?
   - What would prove your hypothesis wrong?

5. **Design the Fix**
   - What's the minimal change to fix this?
   - Are there side effects to consider?
   - How would you test the fix?`,
        feature: `# Implementation Strategy

Think step by step:

1. **Understand Requirements**
   - What is the core functionality needed?
   - What are the inputs and outputs?
   - What edge cases exist?

2. **Design the Solution**
   - Where does this fit in the existing architecture?
   - What patterns should be followed?
   - What dependencies are needed?

3. **Plan the Implementation**
   - What files need to be created/modified?
   - What order should changes be made?
   - How will this be tested?

4. **Consider Quality**
   - Error handling strategy?
   - Performance implications?
   - Security considerations?`,
        refactor: `# Refactoring Approach

Think step by step:

1. **Catalog Current Issues**
   - What code smells exist?
   - What principles are violated?
   - What makes this hard to maintain?

2. **Define Target State**
   - What should the code look like?
   - What patterns apply here?
   - What benefits will this bring?

3. **Plan Safe Transformation**
   - What are the smallest safe steps?
   - How do you verify nothing breaks?
   - What's the rollback plan?

4. **Preserve Behavior**
   - What tests exist/are needed?
   - What edge cases must be preserved?
   - How do you verify equivalence?`,
        testing: `# Testing Strategy

Think step by step:

1. **Identify What to Test**
   - What is the public API?
   - What are the happy paths?
   - What are the edge cases?
   - What can go wrong?

2. **Design Test Cases**
   - Unit tests for logic
   - Integration tests for workflows
   - Error handling tests
   - Boundary conditions

3. **Set Up Test Environment**
   - What needs mocking?
   - What test data is needed?
   - What assertions verify correctness?

4. **Ensure Coverage**
   - Are all branches covered?
   - Are error paths tested?
   - Is the test readable and maintainable?`
    };
    // Add issue-specific guidance if available
    let guide = guides[scenario] || `# Approach

Think step by step through this ${task.action} task:
1. Understand what's needed
2. Analyze the existing code
3. Plan your approach
4. Implement carefully
5. Verify the result`;
    // Add issue-specific context
    if (task.issueType) {
        guide += `\n\n## Issue Context
- **Problem Type:** ${task.issueType}`;
        if (task.errorMessage)
            guide += `\n- **Error:** \`${task.errorMessage}\``;
        if (task.currentBehavior)
            guide += `\n- **Current Behavior:** ${task.currentBehavior}`;
        if (task.expectedBehavior)
            guide += `\n- **Expected Behavior:** ${task.expectedBehavior}`;
    }
    return guide;
}
function getOutputFormat(scenario, _task) {
    const formats = {
        bugfix: `# Required Output Format

## 1. Root Cause Analysis
\`\`\`
Confidence: [HIGH/MEDIUM/LOW]
Cause: [One sentence description]
Location: [file:line or file > function]
Explanation: [Why this causes the issue]
\`\`\`

## 2. The Fix
\`\`\`typescript
// File: [path/to/file.ts]
// Location: [function/class name]

[Complete corrected code - not partial snippets]
\`\`\`

## 3. Verification
\`\`\`typescript
// Test to verify the fix
describe('[component/function]', () => {
  it('should [expected behavior]', () => {
    // ... test code
  });
});
\`\`\`

## 4. Prevention
- How to prevent similar issues in the future`,
        feature: `# Required Output Format

## 1. Implementation Plan
- Files to create/modify
- Key decisions made

## 2. Code
Provide COMPLETE, PRODUCTION-READY code for each file:

\`\`\`typescript
// File: [exact/path/to/file.ts]

[Complete file content - no omissions]
\`\`\`

## 3. Usage Example
\`\`\`typescript
// How to use this feature
\`\`\`

## 4. Tests (if applicable)
\`\`\`typescript
// File: [path/to/file.spec.ts]
\`\`\``,
        refactor: `# Required Output Format

## 1. Issues Found
| Issue | Location | Severity |
|-------|----------|----------|
| [description] | [file:location] | [HIGH/MED/LOW] |

## 2. Refactored Code
\`\`\`typescript
// File: [path/to/file.ts]

[Complete refactored code]
\`\`\`

## 3. Changes Summary
- What was changed and why
- What patterns were applied
- Behavior preserved: [YES/NO, explain]`,
        testing: `# Required Output Format

## Test File
\`\`\`typescript
// File: [path/to/file.spec.ts]

import { [imports] } from '[module]';

describe('[Unit under test]', () => {
  // Setup
  beforeEach(() => {
    [setup code]
  });

  describe('[method/feature]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      [setup]
      
      // Act
      [execute]
      
      // Assert
      [verify]
    });

    it('should handle [edge case]', () => {
      // ...
    });

    it('should throw when [error condition]', () => {
      // ...
    });
  });
});
\`\`\`

## Coverage
- Happy path: ✓
- Edge cases: ✓
- Error handling: ✓`,
        explanation: `# Required Output Format

## Overview
[2-3 sentence summary of what this code does]

## Architecture Diagram
\`\`\`
[ASCII diagram showing structure/flow]
\`\`\`

## Component Breakdown
### [Component 1 Name]
- **Purpose:** [what it does]
- **Key Methods:**
  - \`methodName()\`: [what it does]
- **Dependencies:** [what it uses]

## Data Flow
1. [First step]
2. [Second step]
...

## Key Insights
- [Important detail 1]
- [Important detail 2]`,
        documentation: `# Required Output Format

## API Documentation
\`\`\`typescript
/**
 * [Brief description]
 * 
 * @description [Detailed explanation]
 * @param {Type} paramName - [Description]
 * @returns {Type} [Description]
 * @throws {ErrorType} [When this error occurs]
 * @example
 * // Usage example
 * const result = functionName(args);
 * \`\`\`
 */
\`\`\`

## README Section
\`\`\`markdown
# [Feature/Component Name]

## Overview
[What it does and why]

## Installation
[Steps if applicable]

## Usage
[Code examples]

## API Reference
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|

## Examples
[Common use cases]
\`\`\``,
        migration: `# Required Output Format

## Migration Plan

### 1. Pre-Migration Checklist
- [ ] Backup current state
- [ ] Review breaking changes
- [ ] Update dependencies

### 2. Breaking Changes
| Change | Impact | Migration Path |
|--------|--------|----------------|
| [old API] | [what breaks] | [how to update] |

### 3. Step-by-Step Migration
\`\`\`typescript
// BEFORE (old version)
[old code]

// AFTER (new version)  
[new code]
\`\`\`

### 4. Verification
- [ ] Tests pass
- [ ] No console errors
- [ ] Features work as expected

### 5. Rollback Plan
[How to revert if needed]`,
        optimization: `# Required Output Format

## Performance Analysis

### Current State
- **Metric:** [e.g., Load time: 3.2s]
- **Bottleneck:** [Identified issue]
- **Impact:** [User/system effect]

### Optimization Strategy
| Technique | Expected Gain | Effort |
|-----------|---------------|--------|
| [technique] | [improvement] | [LOW/MED/HIGH] |

### Optimized Code
\`\`\`typescript
// File: [path]
// Optimization: [what was improved]

[optimized code]
\`\`\`

### Benchmarks
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| [metric] | [value] | [value] | [%] |

### Trade-offs
- [What was sacrificed for performance, if anything]`,
        database: `# Required Output Format

## Database Design

### Schema
\`\`\`sql
-- Table: [table_name]
CREATE TABLE [table_name] (
  [column definitions]
);

-- Indexes
CREATE INDEX [index_name] ON [table]([columns]);
\`\`\`

### Query
\`\`\`sql
-- Purpose: [what this query does]
-- Expected rows: [estimate]
-- Time complexity: [O(n), etc.]

[SQL query]
\`\`\`

### TypeScript Integration
\`\`\`typescript
// File: [path/to/repository.ts]

[TypeScript code for DB access]
\`\`\`

### Performance Considerations
- Indexes used: [list]
- Potential N+1: [YES/NO, mitigation]
- Query plan notes: [observations]`,
        devops: `# Required Output Format

## Infrastructure/Pipeline Configuration

### Configuration File
\`\`\`yaml
# File: [.github/workflows/ci.yml | docker-compose.yml | etc.]

[complete configuration]
\`\`\`

### Environment Variables
| Variable | Purpose | Example |
|----------|---------|--------|
| [VAR_NAME] | [description] | [example value] |

### Deployment Steps
1. [First step]
2. [Second step]
...

### Verification
\`\`\`bash
# Commands to verify deployment
[verification commands]
\`\`\`

### Rollback Procedure
\`\`\`bash
[rollback commands]
\`\`\``,
        security: `# Required Output Format

## Security Assessment

### Vulnerability Found
| Issue | Severity | OWASP Category |
|-------|----------|----------------|
| [description] | [CRITICAL/HIGH/MEDIUM/LOW] | [e.g., A1:Injection] |

### Attack Vector
\`\`\`
[How the vulnerability could be exploited]
\`\`\`

### Secure Implementation
\`\`\`typescript
// File: [path]
// Security: [what was fixed]

[secure code]
\`\`\`

### Additional Hardening
- [ ] [Security measure 1]
- [ ] [Security measure 2]

### Testing Security
\`\`\`typescript
// Security test
it('should prevent [attack type]', () => {
  [test code]
});
\`\`\``,
        accessibility: `# Required Output Format

## Accessibility Audit

### Issues Found
| Issue | WCAG Criterion | Severity | Element |
|-------|----------------|----------|--------|
| [description] | [e.g., 1.1.1] | [A/AA/AAA] | [selector] |

### Fixes
\`\`\`typescript
// File: [path]
// Before: [issue]
// After: [accessible]

[accessible code]
\`\`\`

### ARIA Implementation
\`\`\`html
<!-- Proper ARIA usage -->
[HTML with ARIA attributes]
\`\`\`

### Keyboard Navigation
- Tab order: [description]
- Focus indicators: [implementation]
- Keyboard shortcuts: [if applicable]

### Screen Reader Testing
- Tested with: [NVDA/VoiceOver/etc.]
- Announcements: [what gets read]`,
        regex: `# Required Output Format

## Regular Expression

### Pattern
\`\`\`regex
[the regex pattern]
\`\`\`

### Explanation
\`\`\`
[pattern]    ← [explanation of each part]
  │
  └── [breakdown character by character or group by group]
\`\`\`

### Test Cases
| Input | Match? | Captured Groups |
|-------|--------|----------------|
| [test1] | ✓/✗ | [groups] |
| [test2] | ✓/✗ | [groups] |

### Usage
\`\`\`typescript
const pattern = /[regex]/[flags];

// Examples
pattern.test('[input]');  // returns: true/false
'[string]'.match(pattern);  // returns: [matches]
\`\`\`

### Edge Cases
- [edge case 1]: [how it's handled]
- [edge case 2]: [how it's handled]`,
        review: `# Required Output Format

## Code Review Summary

### Overview
- **Changes:** [brief summary]
- **Risk Level:** [LOW/MEDIUM/HIGH]
- **Recommendation:** [APPROVE/REQUEST_CHANGES/COMMENT]

### Issues Found
| Type | Location | Severity | Description |
|------|----------|----------|-------------|
| 🐛 Bug | [file:line] | [severity] | [issue] |
| ⚠️ Warning | [file:line] | [severity] | [issue] |
| 💡 Suggestion | [file:line] | [severity] | [improvement] |

### Detailed Feedback
#### [file.ts]
\`\`\`typescript
// Line X: [issue type]
[code snippet]
// Suggestion: [what to do instead]
\`\`\`

### Positive Aspects
- ✅ [Good thing 1]
- ✅ [Good thing 2]

### Required Changes
1. [Must fix before merge]

### Optional Improvements
1. [Nice to have]`,
        commit: `# Required Output Format

## Commit Message
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Example
\`\`\`
feat(auth): add JWT refresh token rotation

- Implement automatic token refresh before expiry
- Add refresh token storage in httpOnly cookie
- Handle token refresh race conditions

Closes #123
BREAKING CHANGE: refreshToken() now returns Promise<TokenPair>
\`\`\`

### Type Reference
| Type | Usage |
|------|-------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting |
| refactor | Code restructuring |
| perf | Performance |
| test | Testing |
| chore | Maintenance |`,
        learning: `# Required Output Format

## Learning Guide: [Topic]

### Prerequisites
- [What you should know first]

### Concept Overview
[Simple explanation with analogy]

### Step-by-Step Tutorial

#### Step 1: [First concept]
\`\`\`typescript
// Simple example
[basic code]
\`\`\`
**What's happening:** [explanation]

#### Step 2: [Building on Step 1]
\`\`\`typescript
// Building on previous
[expanded code]
\`\`\`

### Practice Exercise
**Challenge:** [description]
\`\`\`typescript
// Try this yourself:
[starter code]
\`\`\`

<details>
<summary>Solution</summary>

\`\`\`typescript
[solution]
\`\`\`
</details>

### Common Mistakes
- ❌ [Mistake] → ✅ [Correction]

### Next Steps
- [What to learn next]`,
        data: `# Required Output Format

## Data Transformation

### Input Format
\`\`\`json
[sample input data]
\`\`\`

### Output Format
\`\`\`json
[expected output data]
\`\`\`

### Transformation Code
\`\`\`typescript
// File: [path/to/transformer.ts]

[transformation implementation]
\`\`\`

### Validation
\`\`\`typescript
// Schema/validation
[validation code]
\`\`\`

### Edge Cases Handled
| Input | Handling |
|-------|----------|
| null/undefined | [behavior] |
| empty array | [behavior] |
| malformed data | [behavior] |`,
        pseudocode: `# Required Output Format

## Algorithm: [Name]

### Problem Statement
[What we're solving]

### Pseudocode
\`\`\`
FUNCTION algorithmName(input):
    // Step 1: [description]
    [pseudocode]
    
    // Step 2: [description]
    [pseudocode]
    
    RETURN result
END FUNCTION
\`\`\`

### Complexity Analysis
- **Time:** O([complexity]) - [explanation]
- **Space:** O([complexity]) - [explanation]

### Implementation
\`\`\`typescript
// File: [path]

[actual code]
\`\`\`

### Trace Example
| Step | State | Action |
|------|-------|--------|
| 1 | [state] | [action] |
| 2 | [state] | [action] |`,
        prototype: `# Required Output Format

## Prototype: [Feature Name]

### Goal
[What we're proving/testing]

### Quick Implementation
\`\`\`typescript
// File: [path]
// NOTE: Prototype code - not production ready

[working prototype code]
\`\`\`

### Demo
\`\`\`typescript
// How to test it
[demo code]
\`\`\`

### Limitations (OK for prototype)
- [ ] No error handling for [case]
- [ ] Hardcoded [values]
- [ ] Missing [feature]

### Path to Production
| Prototype | Production Need |
|-----------|----------------|
| [shortcut] | [proper implementation] |`,
        pair: `# Let's Build This Together!

## Our Goal
[What we're building]

## Current Thinking
I see a few approaches we could take:

### Option A: [Approach 1]
- Pros: [benefits]
- Cons: [drawbacks]

### Option B: [Approach 2]
- Pros: [benefits]
- Cons: [drawbacks]

## Let's Start Here
\`\`\`typescript
// Starting point - what do you think?
[initial code]
\`\`\`

## Questions for You
1. [Question about requirements/preferences]
2. [Question about edge cases]

## Next Steps
Once you confirm, we'll:
1. [Next step]
2. [Following step]`
    };
    return formats[scenario] || `# Required Output Format

Provide clear, complete, production-ready code with:
1. All necessary imports
2. Full implementation (no "..." or placeholders)
3. Proper error handling
4. Comments for complex logic
5. File paths for each code block

Format each code block as:
\`\`\`typescript
// File: [exact/path/to/file.ts]
[complete code]
\`\`\``;
}
function getQualityChecklist(scenario, dependencyImpact) {
    const checklists = {
        bugfix: [
            "Root cause is clearly identified (not just symptoms)",
            "Fix addresses the actual issue",
            "No side effects introduced",
            "Test case prevents regression",
            "Error handling is appropriate"
        ],
        feature: [
            "Follows existing project patterns",
            "TypeScript types are complete (no 'any')",
            "Error handling is comprehensive",
            "Edge cases are handled",
            "Code is testable"
        ],
        refactor: [
            "Behavior is 100% preserved",
            "All tests still pass",
            "Code is more readable/maintainable",
            "SOLID principles applied appropriately",
            "No dead code introduced"
        ],
        testing: [
            "Tests are independent (no order dependency)",
            "Mocks are minimal and realistic",
            "Edge cases covered",
            "Error paths tested",
            "Tests are readable and maintainable"
        ],
        explanation: [
            "Explanation covers the purpose and responsibility",
            "Key methods and data flow are explained",
            "Dependencies and relationships are identified",
            "Terminology is clear for the target audience",
            "Diagrams or examples aid understanding"
        ],
        documentation: [
            "All public APIs are documented",
            "Examples are runnable and accurate",
            "Edge cases and errors are documented",
            "Documentation matches actual code behavior",
            "Format is consistent with project standards"
        ],
        migration: [
            "All breaking changes are identified",
            "Migration steps are clear and tested",
            "Rollback plan exists",
            "Data integrity is preserved",
            "Dependent systems are considered"
        ],
        optimization: [
            "Performance improvement is measurable",
            "Benchmarks compare before/after",
            "No functionality is broken",
            "Memory usage is acceptable",
            "Trade-offs are documented"
        ],
        database: [
            "Queries are optimized (explain plan checked)",
            "Indexes are appropriate",
            "SQL injection is prevented",
            "Transactions handle edge cases",
            "Migration is reversible"
        ],
        devops: [
            "Configuration is environment-agnostic",
            "Secrets are not hardcoded",
            "Rollback procedure exists",
            "Health checks are implemented",
            "Logging is sufficient for debugging"
        ],
        security: [
            "Input is validated and sanitized",
            "Authentication/authorization is correct",
            "Sensitive data is protected",
            "OWASP top 10 are addressed",
            "Security tests are included"
        ],
        accessibility: [
            "WCAG 2.1 AA compliance achieved",
            "Keyboard navigation works",
            "Screen reader testing done",
            "Color contrast is sufficient",
            "Focus management is correct"
        ],
        regex: [
            "Pattern handles all valid inputs",
            "Edge cases are tested",
            "Performance is acceptable (no ReDoS)",
            "Pattern is readable with comments",
            "Capture groups are correct"
        ],
        review: [
            "Feedback is specific and actionable",
            "Severity is accurately assessed",
            "Positive aspects are noted",
            "Suggestions include examples",
            "Tone is constructive"
        ],
        commit: [
            "Message follows conventional format",
            "Scope is accurate",
            "Breaking changes are marked",
            "Related issues are referenced",
            "Message is descriptive but concise"
        ],
        learning: [
            "Prerequisites are clearly stated",
            "Concepts build progressively",
            "Examples are practical and runnable",
            "Common mistakes are addressed",
            "Next steps are provided"
        ],
        data: [
            "All input formats are handled",
            "Validation catches malformed data",
            "Transformations are reversible if needed",
            "Null/undefined cases handled",
            "Performance scales with data size"
        ],
        pseudocode: [
            "Logic is clear and unambiguous",
            "Complexity analysis is correct",
            "Edge cases are addressed",
            "Implementation matches pseudocode",
            "Algorithm is optimal for the problem"
        ],
        prototype: [
            "Core concept is demonstrated",
            "Limitations are documented",
            "Path to production is clear",
            "Code is easily disposable/replaceable",
            "Demo instructions are provided"
        ],
        pair: [
            "Approach options are presented",
            "Trade-offs are explained",
            "Questions clarify requirements",
            "Code is iterative and discussable",
            "Next steps are clear"
        ]
    };
    let checks = checklists[scenario] || [
        "Code is complete and runnable",
        "Types are explicit and correct",
        "Error handling exists",
        "Code follows project conventions"
    ];
    // Add dependency-related checks if there's significant impact
    if (dependencyImpact && dependencyImpact.dependentFiles.length > 0) {
        const dependencyChecks = [
            `Verified changes don't break ${dependencyImpact.dependentFiles.length} dependent files`,
            "Public API signatures preserved (or dependents updated)",
            "No breaking changes to exported types/interfaces"
        ];
        if (dependencyImpact.impactLevel === "high" || dependencyImpact.impactLevel === "critical") {
            dependencyChecks.push("Listed all files that need updates due to this change");
        }
        checks = [...checks, ...dependencyChecks];
    }
    return `# Quality Checklist

Before responding, verify:
${checks.map(c => `- [ ] ${c}`).join("\n")}

**Important:** Provide COMPLETE, WORKING code. Never use "..." or "existing code" placeholders.`;
}
//# sourceMappingURL=smartPromptGenerator.js.map