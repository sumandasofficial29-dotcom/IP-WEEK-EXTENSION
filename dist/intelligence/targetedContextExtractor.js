"use strict";
/**
 * Targeted Context Extractor
 *
 * Extracts only the code context that's relevant to the user's task.
 * Avoids information overload by focusing on what matters.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTargetedContext = extractTargetedContext;
exports.formatTargetedContext = formatTargetedContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Extracts targeted context based on the analyzed task
 */
function extractTargetedContext(task, projectRoot, activeFilePath, activeFileContent, availableClasses = []) {
    const context = {
        relatedFiles: [],
        relatedClasses: [],
        imports: [],
        usedBy: [],
        summary: ""
    };
    // 1. Process primary file (active editor)
    if (activeFilePath && activeFileContent) {
        context.primaryFile = analyzeFile(activeFilePath, activeFileContent, projectRoot, task);
    }
    // 2. Find related files based on task mentions
    const relatedPaths = findRelatedFiles(task, projectRoot, activeFilePath);
    for (const relPath of relatedPaths.slice(0, 5)) { // Limit to 5 most relevant
        const fullPath = path.join(projectRoot, relPath);
        try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const fileCtx = analyzeFile(fullPath, content, projectRoot, task);
            if (fileCtx.relevanceScore > 0.3) {
                context.relatedFiles.push(fileCtx);
            }
        }
        catch {
            // File not readable
        }
    }
    // 3. Extract relevant classes
    context.relatedClasses = extractRelatedClasses(task, availableClasses);
    // 4. Build import/dependency chain
    if (context.primaryFile) {
        context.imports = context.primaryFile.imports;
        context.usedBy = findUsages(path.basename(context.primaryFile.path, ".ts"), projectRoot);
    }
    // 5. Generate summary
    context.summary = generateContextSummary(context, task);
    return context;
}
function analyzeFile(filePath, content, projectRoot, task) {
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    const lines = content.split("\n");
    // Calculate relevance
    const { score, reason } = calculateFileRelevance(relativePath, content, task);
    // Extract relevant sections
    const relevantSections = extractRelevantSections(lines, task);
    // Parse imports and exports
    const imports = extractImports(content);
    const exports = extractExports(content);
    // Determine what content to include
    const maxContentLength = 5000;
    let fullContent;
    if (content.length <= maxContentLength) {
        // Small file - include full content
        fullContent = content;
    }
    else if (relevantSections.length === 0) {
        // Large file with no specific sections found - show structural overview
        fullContent = extractFileOverview(lines);
    }
    else {
        // Large file with relevant sections - will use relevantSections
        fullContent = undefined;
    }
    return {
        path: filePath,
        relativePath,
        relevanceScore: score,
        relevanceReason: reason,
        fullContent,
        relevantSections,
        imports,
        exports
    };
}
function calculateFileRelevance(relativePath, content, task) {
    let score = 0;
    const reasons = [];
    // Check if file is mentioned
    for (const mentioned of task.mentionedFiles) {
        if (relativePath.toLowerCase().includes(mentioned.toLowerCase())) {
            score += 0.5;
            reasons.push("Mentioned in task");
            break;
        }
    }
    // Check if classes are mentioned
    for (const className of task.mentionedClasses) {
        if (content.includes(`class ${className}`) || content.includes(`interface ${className}`)) {
            score += 0.4;
            reasons.push(`Contains ${className}`);
        }
    }
    // Check if methods are mentioned
    for (const method of task.mentionedMethods) {
        if (content.includes(method)) {
            score += 0.3;
            reasons.push(`Contains ${method}`);
        }
    }
    // Check target type match
    if (task.target.type === "component" && relativePath.includes(".component.")) {
        score += 0.2;
    }
    if (task.target.type === "service" && relativePath.includes(".service.")) {
        score += 0.2;
    }
    // Check concepts
    for (const concept of task.mentionedConcepts) {
        if (content.toLowerCase().includes(concept)) {
            score += 0.1;
        }
    }
    return {
        score: Math.min(1, score),
        reason: reasons.join(", ") || "Related to project"
    };
}
function extractRelevantSections(lines, task) {
    const sections = [];
    const contextLines = 5; // Lines before/after match
    // Find lines containing mentioned items
    const searchTerms = [
        ...task.mentionedClasses,
        ...task.mentionedMethods,
        ...task.mentionedConcepts
    ];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const term of searchTerms) {
            if (line.includes(term)) {
                const startLine = Math.max(0, i - contextLines);
                const endLine = Math.min(lines.length - 1, i + contextLines);
                // Check if this overlaps with existing section
                const overlapping = sections.find(s => s.startLine <= endLine && s.endLine >= startLine);
                if (overlapping) {
                    // Extend existing section
                    overlapping.startLine = Math.min(overlapping.startLine, startLine);
                    overlapping.endLine = Math.max(overlapping.endLine, endLine);
                    overlapping.content = lines.slice(overlapping.startLine, overlapping.endLine + 1).join("\n");
                }
                else {
                    sections.push({
                        startLine,
                        endLine,
                        content: lines.slice(startLine, endLine + 1).join("\n"),
                        reason: `Contains "${term}"`
                    });
                }
                break;
            }
        }
    }
    // Also extract class/interface declarations
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(export\s+)?(class|interface|type|enum)\s+\w+/.test(line)) {
            // Find the end of this declaration
            let braceCount = 0;
            let endLine = i;
            for (let j = i; j < lines.length && j < i + 100; j++) {
                for (const char of lines[j]) {
                    if (char === "{")
                        braceCount++;
                    if (char === "}")
                        braceCount--;
                }
                endLine = j;
                if (braceCount === 0 && j > i)
                    break;
            }
            // Only include if not too large
            if (endLine - i <= 50) {
                sections.push({
                    startLine: i,
                    endLine,
                    content: lines.slice(i, endLine + 1).join("\n"),
                    reason: "Type/Class declaration"
                });
            }
        }
    }
    // Deduplicate and sort
    return deduplicateSections(sections).slice(0, 10);
}
function deduplicateSections(sections) {
    // Sort by start line
    sections.sort((a, b) => a.startLine - b.startLine);
    const merged = [];
    for (const section of sections) {
        const last = merged[merged.length - 1];
        if (last && section.startLine <= last.endLine + 2) {
            // Merge overlapping sections
            last.endLine = Math.max(last.endLine, section.endLine);
            last.reason = `${last.reason}; ${section.reason}`;
        }
        else {
            merged.push({ ...section });
        }
    }
    return merged;
}
/**
 * Extract a structural overview of a file when no specific terms are found.
 * Shows imports, class/interface declarations, and method signatures.
 */
function extractFileOverview(lines) {
    const overview = [];
    const totalLines = lines.length;
    // 1. Extract imports (first section of the file)
    const importLines = [];
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const line = lines[i];
        if (line.match(/^import\s+/) || line.match(/^\/\//) || line.trim() === '') {
            importLines.push(line);
        }
        else if (importLines.length > 0 && !line.match(/^import/)) {
            // Stop collecting imports when we hit non-import code
            break;
        }
    }
    if (importLines.length > 0) {
        overview.push('// === IMPORTS ===');
        overview.push(...importLines.slice(0, 15)); // Max 15 import lines
        if (importLines.length > 15) {
            overview.push(`// ... ${importLines.length - 15} more imports`);
        }
        overview.push('');
    }
    // 2. Extract class/interface declarations and method signatures
    const structureLines = [];
    let inClass = false;
    let braceDepth = 0;
    let currentClass = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        // Match class or interface declaration
        const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?(?:class|interface)\s+(\w+)/);
        if (classMatch) {
            inClass = true;
            currentClass = classMatch[1];
            braceDepth = 0;
            structureLines.push('');
            structureLines.push(`// === ${classMatch[0].includes('interface') ? 'INTERFACE' : 'CLASS'}: ${currentClass} (line ${i + 1}) ===`);
            structureLines.push(line);
            continue;
        }
        // Track brace depth when inside a class
        if (inClass) {
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceDepth += openBraces - closeBraces;
            // Method signatures (public, private, protected, or async methods)
            const methodMatch = line.match(/^\s*(public|private|protected|async|static|\s)*\s*(\w+)\s*\([^)]*\)\s*[:{]/);
            const arrowMethodMatch = line.match(/^\s*(public|private|protected|readonly)?\s*(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/);
            const getterSetterMatch = line.match(/^\s*(get|set)\s+(\w+)\s*\(/);
            if (methodMatch || arrowMethodMatch || getterSetterMatch) {
                // Include method signature
                structureLines.push(`  ${trimmed.split('{')[0].trim()} { ... }`);
            }
            // Property declarations
            const propertyMatch = line.match(/^\s*(public|private|protected|readonly|\s)+\s*(\w+)\s*[?!]?\s*:/);
            if (propertyMatch && !methodMatch) {
                structureLines.push(`  ${trimmed}`);
            }
            // Decorator on next line's method
            if (trimmed.startsWith('@')) {
                structureLines.push(`  ${trimmed}`);
            }
            // End of class
            if (braceDepth <= 0 && trimmed === '}') {
                structureLines.push('}');
                inClass = false;
                currentClass = '';
            }
        }
        // Standalone functions (not in class)
        if (!inClass) {
            const funcMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                structureLines.push('');
                structureLines.push(`// === FUNCTION: ${funcMatch[1]} (line ${i + 1}) ===`);
                structureLines.push(`${trimmed.split('{')[0].trim()} { ... }`);
            }
            // Export const/type
            const exportMatch = line.match(/^export\s+(const|type|interface|enum)\s+(\w+)/);
            if (exportMatch) {
                structureLines.push(`// ${exportMatch[1]}: ${exportMatch[2]} (line ${i + 1})`);
            }
        }
    }
    if (structureLines.length > 0) {
        overview.push(...structureLines);
    }
    // If we still have nothing useful, show first 40 lines
    if (overview.length < 5 && totalLines > 0) {
        overview.push('// === FILE PREVIEW ===');
        overview.push(...lines.slice(0, 40));
        if (totalLines > 40) {
            overview.push(`// ... ${totalLines - 40} more lines`);
        }
    }
    return overview.join('\n');
}
function extractImports(content) {
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    return imports;
}
function extractExports(content) {
    const exports = [];
    const exportRegex = /export\s+(?:class|interface|function|const|type|enum)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
    }
    return exports;
}
function findRelatedFiles(task, projectRoot, excludePath) {
    const related = [];
    // Search for mentioned files
    for (const file of task.mentionedFiles) {
        const found = findFileByName(projectRoot, file);
        if (found && found !== excludePath) {
            related.push(found);
        }
    }
    // Search for files containing mentioned classes
    for (const className of task.mentionedClasses) {
        const found = findFileContaining(projectRoot, `class ${className}`);
        if (found && found !== excludePath && !related.includes(found)) {
            related.push(found);
        }
    }
    return related;
}
function findFileByName(rootPath, fileName) {
    const searchDirs = ["src", "lib", "app"];
    for (const dir of searchDirs) {
        const result = searchInDir(path.join(rootPath, dir), fileName);
        if (result)
            return path.relative(rootPath, result);
    }
    return undefined;
}
function searchInDir(dir, fileName) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules")
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const result = searchInDir(fullPath, fileName);
                if (result)
                    return result;
            }
            else if (entry.name.toLowerCase().includes(fileName.toLowerCase())) {
                return fullPath;
            }
        }
    }
    catch {
        // Directory not accessible
    }
    return undefined;
}
function findFileContaining(rootPath, searchTerm) {
    const searchDirs = ["src", "lib", "app"];
    for (const dir of searchDirs) {
        const result = searchContentInDir(path.join(rootPath, dir), searchTerm);
        if (result)
            return path.relative(rootPath, result);
    }
    return undefined;
}
function searchContentInDir(dir, searchTerm) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules")
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const result = searchContentInDir(fullPath, searchTerm);
                if (result)
                    return result;
            }
            else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
                try {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    if (content.includes(searchTerm)) {
                        return fullPath;
                    }
                }
                catch {
                    // File not readable
                }
            }
        }
    }
    catch {
        // Directory not accessible
    }
    return undefined;
}
function extractRelatedClasses(task, availableClasses) {
    const related = [];
    for (const classInfo of availableClasses) {
        let isRelated = false;
        let relevance = "";
        // Check if class is mentioned
        if (task.mentionedClasses.includes(classInfo.name)) {
            isRelated = true;
            relevance = "Mentioned in task";
        }
        // Check if any method is mentioned
        for (const method of classInfo.methods) {
            if (task.mentionedMethods.includes(method.name)) {
                isRelated = true;
                relevance = `Contains ${method.name}()`;
                break;
            }
        }
        if (isRelated) {
            related.push({
                name: classInfo.name,
                filePath: classInfo.filePath,
                type: "class",
                relevance,
                properties: [], // Would need deeper parsing
                methods: classInfo.methods.map(m => ({ name: m.name, signature: `${m.name}(${m.parameters.join(", ")})` })),
                declaration: `class ${classInfo.name} { ${classInfo.methods.map(m => m.name).join(", ")} }`
            });
        }
    }
    return related.slice(0, 10);
}
function findUsages(symbolName, projectRoot) {
    const usages = [];
    // Search for imports of this symbol
    const searchDirs = ["src", "lib", "app"];
    for (const dir of searchDirs) {
        findUsagesInDir(path.join(projectRoot, dir), symbolName, usages);
    }
    return usages.slice(0, 10);
}
function findUsagesInDir(dir, symbolName, results) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules")
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                findUsagesInDir(fullPath, symbolName, results);
            }
            else if (entry.name.endsWith(".ts") && results.length < 10) {
                try {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    if (content.includes(`from './${symbolName}'`) ||
                        content.includes(`from "./${symbolName}"`) ||
                        content.includes(`{ ${symbolName} }`)) {
                        results.push(entry.name);
                    }
                }
                catch {
                    // Skip
                }
            }
        }
    }
    catch {
        // Directory not accessible
    }
}
function generateContextSummary(context, _task) {
    const parts = [];
    if (context.primaryFile) {
        parts.push(`**Primary File:** \`${context.primaryFile.relativePath}\``);
        if (context.primaryFile.relevanceReason) {
            parts.push(`  - ${context.primaryFile.relevanceReason}`);
        }
    }
    if (context.relatedFiles.length > 0) {
        parts.push(`\n**Related Files:** ${context.relatedFiles.length}`);
        for (const f of context.relatedFiles.slice(0, 3)) {
            parts.push(`  - \`${f.relativePath}\` (${f.relevanceReason})`);
        }
    }
    if (context.relatedClasses.length > 0) {
        parts.push(`\n**Related Classes:** ${context.relatedClasses.map(c => c.name).join(", ")}`);
    }
    if (context.imports.length > 0) {
        parts.push(`\n**Key Imports:** ${context.imports.slice(0, 5).join(", ")}`);
    }
    if (context.usedBy.length > 0) {
        parts.push(`\n**Used By:** ${context.usedBy.join(", ")}`);
    }
    return parts.join("\n");
}
/**
 * Formats the targeted context for inclusion in the prompt
 */
function formatTargetedContext(context) {
    const parts = [];
    // Summary
    parts.push("## Context Summary");
    parts.push(context.summary);
    // Primary file code
    if (context.primaryFile) {
        parts.push("\n## Primary File");
        parts.push(`\`\`\`typescript`);
        parts.push(`// File: ${context.primaryFile.relativePath}`);
        if (context.primaryFile.fullContent) {
            parts.push(context.primaryFile.fullContent);
        }
        else {
            parts.push("// Relevant sections:");
            for (const section of context.primaryFile.relevantSections) {
                parts.push(`\n// Lines ${section.startLine + 1}-${section.endLine + 1} (${section.reason})`);
                parts.push(section.content);
            }
        }
        parts.push("```");
    }
    // Related classes
    if (context.relatedClasses.length > 0) {
        parts.push("\n## Related Types");
        for (const cls of context.relatedClasses) {
            parts.push(`\n### ${cls.name}`);
            parts.push(`- **File:** ${cls.filePath}`);
            parts.push(`- **Relevance:** ${cls.relevance}`);
            parts.push(`- **Methods:** ${cls.methods.map(m => m.name).join(", ")}`);
        }
    }
    // Related file excerpts
    if (context.relatedFiles.length > 0) {
        parts.push("\n## Related Files");
        for (const file of context.relatedFiles.slice(0, 3)) {
            parts.push(`\n### ${file.relativePath}`);
            parts.push(`> ${file.relevanceReason}`);
            if (file.relevantSections.length > 0) {
                parts.push("```typescript");
                for (const section of file.relevantSections.slice(0, 2)) {
                    parts.push(`// ${section.reason}`);
                    parts.push(section.content);
                }
                parts.push("```");
            }
        }
    }
    return parts.join("\n");
}
//# sourceMappingURL=targetedContextExtractor.js.map