"use strict";
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
exports.hasLanguageFiles = hasLanguageFiles;
exports.getVersion = getVersion;
exports.walkFiles = walkFiles;
exports.hasFilesMatching = hasFilesMatching;
exports.hasCodePattern = hasCodePattern;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Helper function to check if any language files exist
 */
function hasLanguageFiles(context, extensions) {
    for (const ext of extensions) {
        if ((context.fileExtensionCounts[ext] || 0) > 0) {
            return true;
        }
    }
    return false;
}
/**
 * Helper function to get package version
 */
function getVersion(context, packageName) {
    return context.depVersions[packageName]?.replace(/[\^~]/, "");
}
/**
 * Helper function to walk files in the repository
 */
function walkFiles(rootPath, callback, maxDepth = 6, dir, depth = 0) {
    if (depth >= maxDepth)
        return;
    const currentDir = dir || rootPath;
    try {
        const entries = fs.readdirSync(currentDir);
        for (const entry of entries) {
            // Skip hidden folders and common non-source directories
            if (entry.startsWith(".") ||
                [
                    "node_modules",
                    "dist",
                    "build",
                    "coverage",
                    ".git",
                    "vendor",
                    "__pycache__",
                    "target",
                    "bin",
                    "obj",
                    ".vs",
                    ".idea"
                ].includes(entry)) {
                continue;
            }
            const fullPath = path.join(currentDir, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walkFiles(rootPath, callback, maxDepth, fullPath, depth + 1);
                }
                else {
                    callback(fullPath);
                }
            }
            catch {
                // Skip
            }
        }
    }
    catch {
        // Skip
    }
}
/**
 * Helper function to check if files matching a pattern exist
 */
function hasFilesMatching(rootPath, pattern) {
    let found = false;
    walkFiles(rootPath, (filePath) => {
        if (!found && pattern.test(filePath)) {
            found = true;
        }
    }, 4);
    return found;
}
/**
 * Helper function to check for code patterns in source files
 */
function hasCodePattern(rootPath, pattern) {
    let found = false;
    walkFiles(rootPath, (filePath) => {
        if (found)
            return;
        const ext = path.extname(filePath).toLowerCase();
        // Only check source files
        if ([".cpp", ".cc", ".c", ".h", ".hpp", ".py", ".java", ".ts", ".js"].includes(ext)) {
            try {
                const content = fs.readFileSync(filePath, "utf-8").substring(0, 10000); // First 10KB
                if (pattern.test(content)) {
                    found = true;
                }
            }
            catch {
                // Skip unreadable files
            }
        }
    }, 3);
    return found;
}
//# sourceMappingURL=detectorContext.js.map