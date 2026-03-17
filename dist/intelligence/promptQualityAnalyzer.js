"use strict";
/**
 * Real-time Prompt Quality Analyzer
 *
 * Purpose: Evaluate if the generated prompt will get an accurate
 * LLM response in the first try.
 *
 * Based on research showing 75% of AI suggestions are ignored and
 * only 12.5% are actually used. Good prompts = accurate solutions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePromptQuality = analyzePromptQuality;
exports.explainQuality = explainQuality;
/**
 * Analyzes prompt quality in real-time
 */
function analyzePromptQuality(input) {
    const dimensions = [];
    const criticalIssues = [];
    const improvements = [];
    // 1. Task Clarity (25% weight)
    const taskClarity = analyzeTaskClarity(input.userTask);
    dimensions.push(taskClarity);
    if (taskClarity.issue)
        criticalIssues.push(taskClarity.issue);
    if (taskClarity.suggestion)
        improvements.push(taskClarity.suggestion);
    // 2. Target Specificity (20% weight)
    const targetSpec = analyzeTargetSpecificity(input);
    dimensions.push(targetSpec);
    if (targetSpec.issue)
        criticalIssues.push(targetSpec.issue);
    if (targetSpec.suggestion)
        improvements.push(targetSpec.suggestion);
    // 3. Context Relevance (25% weight)
    const contextRelevance = analyzeContextRelevance(input);
    dimensions.push(contextRelevance);
    if (contextRelevance.issue)
        criticalIssues.push(contextRelevance.issue);
    if (contextRelevance.suggestion)
        improvements.push(contextRelevance.suggestion);
    // 4. Actionability (20% weight)
    const actionability = analyzeActionability(input.userTask, input);
    dimensions.push(actionability);
    if (actionability.issue)
        criticalIssues.push(actionability.issue);
    if (actionability.suggestion)
        improvements.push(actionability.suggestion);
    // 5. Technical Context (10% weight)
    const techContext = analyzeTechnicalContext(input);
    dimensions.push(techContext);
    if (techContext.suggestion)
        improvements.push(techContext.suggestion);
    // Calculate weighted overall score
    const overallScore = Math.round(dimensions.reduce((sum, d) => sum + (d.score * d.weight), 0) /
        dimensions.reduce((sum, d) => sum + d.weight, 0));
    // Determine likelihood of accurate response
    const likelihood = overallScore >= 75 ? "High" :
        overallScore >= 50 ? "Medium" : "Low";
    return {
        overallScore,
        likelihood,
        dimensions,
        criticalIssues: criticalIssues.filter(Boolean),
        improvements: improvements.filter(Boolean).slice(0, 3),
        readyToUse: overallScore >= 60 && criticalIssues.length === 0
    };
}
/**
 * Analyzes how clear and specific the user's task description is
 */
function analyzeTaskClarity(task) {
    let score = 50; // Base score
    let issue;
    let suggestion;
    const words = task.split(/\s+/).length;
    const lower = task.toLowerCase();
    // Penalize very short tasks
    if (words < 5) {
        score -= 30;
        issue = "Task too vague";
        suggestion = "Describe the task in more detail";
    }
    else if (words >= 10) {
        score += 15;
    }
    // Check for action verbs (clear intent)
    const actionVerbs = ["add", "create", "fix", "update", "remove", "implement",
        "refactor", "optimize", "test", "debug", "explain", "migrate"];
    if (actionVerbs.some(v => lower.includes(v))) {
        score += 15;
    }
    else {
        suggestion = "Start with a clear action: add, fix, create, etc.";
    }
    // Check for specific identifiers (class names, file names)
    const hasSpecificName = /[A-Z][a-z]+([A-Z][a-z]+)+/.test(task) || // PascalCase
        /\w+\.(ts|js|tsx|jsx|vue|py|java)/.test(task); // file extension
    if (hasSpecificName) {
        score += 20;
    }
    // Check for expected behavior description
    if (lower.includes("should") || lower.includes("when") ||
        lower.includes("so that") || lower.includes("expect")) {
        score += 10;
    }
    // Penalize ambiguous references
    const ambiguous = (task.match(/\b(it|this|that)\b/gi) || []).length;
    if (ambiguous > 2) {
        score -= 15;
        issue = "Too many ambiguous references";
        suggestion = "Replace 'it/this/that' with specific names";
    }
    // Bonus for mentioning error messages or specific behavior
    if (lower.includes("error") || lower.includes("exception") ||
        lower.includes("returns") || lower.includes("displays")) {
        score += 10;
    }
    score = Math.max(0, Math.min(100, score));
    return {
        name: "Task Clarity",
        score,
        weight: 25,
        status: getStatus(score),
        issue,
        suggestion
    };
}
/**
 * Analyzes if the target (file, component, function) is clearly specified
 */
function analyzeTargetSpecificity(input) {
    let score = 30; // Base score
    let issue;
    let suggestion;
    // Active file is open - big bonus
    if (input.activeFilePath) {
        score += 35;
    }
    else {
        suggestion = "Open the target file for better context";
    }
    // File content available
    if (input.activeFileContent) {
        score += 20;
    }
    // Check if task mentions specific class/method
    const mentionsSpecific = /[A-Z][a-z]+([A-Z][a-z]+)+/.test(input.userTask) ||
        /\w+\(\)/.test(input.userTask) ||
        /\w+\.(ts|js|tsx|jsx)/.test(input.userTask);
    if (mentionsSpecific) {
        score += 15;
    }
    // No file open and no specific mention
    if (!input.activeFilePath && !mentionsSpecific) {
        issue = "No target file or component specified";
        suggestion = "Open the file you want to modify, or mention it by name";
    }
    score = Math.max(0, Math.min(100, score));
    return {
        name: "Target Specificity",
        score,
        weight: 20,
        status: getStatus(score),
        issue,
        suggestion
    };
}
/**
 * Analyzes if relevant context was found and included
 */
function analyzeContextRelevance(input) {
    let score = 20; // Base score
    let issue;
    let suggestion;
    // Classes found
    if (input.classesFound > 0) {
        score += Math.min(input.classesFound * 5, 20);
    }
    // Methods analyzed
    if (input.methodsFound > 0) {
        score += Math.min(input.methodsFound * 2, 15);
    }
    // Interfaces/types found
    if (input.interfacesFound > 0) {
        score += Math.min(input.interfacesFound * 3, 15);
    }
    // Related files found
    if (input.relevantFilesCount > 0) {
        score += Math.min(input.relevantFilesCount * 5, 20);
    }
    // API endpoints (for HTTP-related tasks)
    if (input.hasAPIs) {
        score += 10;
    }
    // No relevant code found
    if (input.classesFound === 0 && input.methodsFound === 0) {
        issue = "No relevant code found";
        suggestion = "Ensure the target file contains TypeScript/JavaScript code";
    }
    score = Math.max(0, Math.min(100, score));
    return {
        name: "Context Relevance",
        score,
        weight: 25,
        status: getStatus(score),
        issue,
        suggestion
    };
}
/**
 * Analyzes if the task is actionable - can LLM act on it?
 */
function analyzeActionability(task, input) {
    let score = 40; // Base score
    let issue;
    let suggestion;
    const lower = task.toLowerCase();
    // Has clear action
    const actions = ["add", "create", "fix", "update", "remove", "delete",
        "implement", "refactor", "change", "modify", "write", "generate"];
    if (actions.some(a => lower.includes(a))) {
        score += 20;
    }
    // Has where/what context
    if (input.activeFilePath || /\b(in|to|from|for)\s+\w+/.test(task)) {
        score += 15;
    }
    // Has expected outcome
    if (lower.includes("should") || lower.includes("return") ||
        lower.includes("display") || lower.includes("show") ||
        lower.includes("output")) {
        score += 15;
    }
    // Framework detected - helps LLM use right patterns
    if (input.frameworkDetected) {
        score += 10;
    }
    // Vague task check
    const vaguePatterns = [
        /^fix\s*(it|this|the\s+bug)?$/i,
        /^make\s+it\s+work$/i,
        /^help$/i,
        /^improve$/i
    ];
    if (vaguePatterns.some(p => p.test(task.trim()))) {
        score = 20;
        issue = "Task too vague to act on";
        suggestion = "Describe WHAT to fix and WHERE";
    }
    score = Math.max(0, Math.min(100, score));
    return {
        name: "Actionability",
        score,
        weight: 20,
        status: getStatus(score),
        issue,
        suggestion
    };
}
/**
 * Analyzes technical context completeness
 */
function analyzeTechnicalContext(input) {
    let score = 30; // Base score
    let suggestion;
    // Framework detected
    if (input.frameworkDetected) {
        score += 25;
    }
    else {
        suggestion = "Framework not detected - check package.json exists";
    }
    // Dependencies available
    if (input.dependenciesCount > 0) {
        score += 15;
    }
    // Routes available (for routing tasks)
    if (input.hasRoutes) {
        score += 15;
    }
    // Repo structure analyzed
    if (input.repoStructureDepth >= 3) {
        score += 15;
    }
    score = Math.max(0, Math.min(100, score));
    return {
        name: "Technical Context",
        score,
        weight: 10,
        status: getStatus(score),
        suggestion
    };
}
function getStatus(score) {
    if (score >= 80)
        return "excellent";
    if (score >= 60)
        return "good";
    if (score >= 40)
        return "fair";
    return "poor";
}
/**
 * Generates human-readable explanation of quality
 */
function explainQuality(result) {
    const { overallScore, likelihood, dimensions, criticalIssues, improvements } = result;
    if (overallScore >= 80) {
        return `Excellent (${likelihood} success rate) - Ready for accurate solution`;
    }
    else if (overallScore >= 60) {
        const weakest = dimensions.sort((a, b) => a.score - b.score)[0];
        return `Good - ${weakest.name} could be improved`;
    }
    else if (overallScore >= 40) {
        return `Fair - ${criticalIssues[0] || improvements[0] || "Add more details"}`;
    }
    else {
        return `Needs improvement - ${criticalIssues[0] || "Be more specific"}`;
    }
}
//# sourceMappingURL=promptQualityAnalyzer.js.map