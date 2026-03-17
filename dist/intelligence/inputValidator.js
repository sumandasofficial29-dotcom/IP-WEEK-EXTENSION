"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeInputQuality = analyzeInputQuality;
const VAGUE_PATTERNS = [
    { pattern: /^fix\s+(the\s+)?bug$/i, message: "Specify which bug and where it occurs" },
    { pattern: /^add\s+feature$/i, message: "Describe what feature to add" },
    { pattern: /^make\s+it\s+work$/i, message: "Explain what's not working and expected behavior" },
    { pattern: /^fix\s+this$/i, message: "Describe what 'this' refers to and what's wrong" },
    { pattern: /^improve\s+(this|it)$/i, message: "Specify what aspect to improve" },
    { pattern: /^help$/i, message: "Describe what help you need" },
    { pattern: /^update$/i, message: "Specify what to update and how" },
    { pattern: /^change$/i, message: "Describe what to change and the expected result" }
];
const QUALITY_INDICATORS = {
    hasSpecificComponent: /\b(component|service|module|class|function|method)\b/i,
    hasExpectedBehavior: /\b(should|expect|want|need|must|display|return|show)\b/i,
    hasCurrentBehavior: /\b(currently|instead|but|however|not working|error|fails)\b/i,
    hasFileName: /\.\w{2,4}\b/,
    hasClassName: /\b[A-Z][a-z]+([A-Z][a-z]+)+\b/,
    hasMethodName: /\b\w+\(\)/,
    hasErrorMessage: /\b(error|exception|thrown|failed|undefined|null)\b/i,
    hasSteps: /\b(step|first|then|after|when|if)\b/i,
    hasAcceptanceCriteria: /\b(acceptance|criteria|requirement|spec)\b/i
};
/**
 * Analyzes input quality and provides improvement suggestions
 */
function analyzeInputQuality(task) {
    const issues = [];
    const suggestions = [];
    let score = 50; // Base score
    // Check for vague patterns
    for (const { pattern, message } of VAGUE_PATTERNS) {
        if (pattern.test(task.trim())) {
            issues.push({
                type: "vague",
                message,
                severity: "error"
            });
            score -= 30;
        }
    }
    // Check length
    if (task.length < 20) {
        issues.push({
            type: "vague",
            message: "Task description is too short for accurate analysis",
            severity: "warning"
        });
        score -= 15;
    }
    // Check for quality indicators
    if (QUALITY_INDICATORS.hasSpecificComponent.test(task)) {
        score += 10;
    }
    else {
        suggestions.push("Mention the specific component, service, or file involved");
    }
    if (QUALITY_INDICATORS.hasExpectedBehavior.test(task)) {
        score += 10;
    }
    else {
        suggestions.push("Describe the expected behavior or outcome");
    }
    if (QUALITY_INDICATORS.hasCurrentBehavior.test(task)) {
        score += 10;
    }
    if (QUALITY_INDICATORS.hasClassName.test(task)) {
        score += 8;
    }
    if (QUALITY_INDICATORS.hasMethodName.test(task)) {
        score += 8;
    }
    if (QUALITY_INDICATORS.hasErrorMessage.test(task)) {
        score += 5;
    }
    // Check for ambiguity
    const ambiguousWords = task.match(/\b(it|this|that|here|there)\b/gi);
    if (ambiguousWords && ambiguousWords.length > 2) {
        issues.push({
            type: "ambiguous",
            message: "Too many ambiguous references (it, this, that) - be more specific",
            severity: "warning"
        });
        score -= 10;
    }
    // Normalize score
    score = Math.max(0, Math.min(100, score));
    // Generate enhanced task if needed
    let enhancedTask;
    if (score < 60) {
        enhancedTask = generateEnhancedTask(task, issues);
    }
    return {
        score,
        issues,
        suggestions: suggestions.slice(0, 3),
        enhancedTask
    };
}
function generateEnhancedTask(original, _issues) {
    const lower = original.toLowerCase();
    // Bugfix template
    if (lower.includes("fix") || lower.includes("bug") || lower.includes("error")) {
        return `${original}

Please provide more context:
- **Component/File:** [Which file or component has the bug?]
- **Current Behavior:** [What is happening now?]
- **Expected Behavior:** [What should happen instead?]
- **Error Message:** [Any error messages or stack traces?]
- **Steps to Reproduce:** [How can the bug be triggered?]`;
    }
    // Feature template
    if (lower.includes("add") || lower.includes("create") || lower.includes("implement")) {
        return `${original}

Please provide more context:
- **Target Location:** [Which component/module should this be added to?]
- **User Story:** [As a [user], I want [feature], so that [benefit]]
- **Acceptance Criteria:** [What conditions must be met?]
- **Edge Cases:** [Any special scenarios to handle?]`;
    }
    // Refactor template
    if (lower.includes("refactor") || lower.includes("improve") || lower.includes("optimize")) {
        return `${original}

Please provide more context:
- **Target Code:** [Which file/function to refactor?]
- **Current Issues:** [What problems exist with current implementation?]
- **Goals:** [What improvements are expected?]
- **Constraints:** [Any APIs or behaviors that must be preserved?]`;
    }
    // Generic template
    return `${original}

To generate a more accurate prompt, please specify:
- **Target:** Which file, component, or function?
- **Goal:** What should be the end result?
- **Context:** Any relevant background information?`;
}
//# sourceMappingURL=inputValidator.js.map