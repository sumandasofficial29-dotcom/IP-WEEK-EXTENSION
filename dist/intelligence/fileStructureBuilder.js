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
exports.FileStructureBuilder = void 0;
exports.buildCompactStructure = buildCompactStructure;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_OPTIONS = {
    maxDepth: 4,
    maxItemsPerLevel: 15,
    showFileCount: true,
    prioritizeFolders: true
};
const IGNORE_PATTERNS = [
    "node_modules",
    "dist",
    "build",
    "out",
    ".git",
    ".vscode",
    ".idea",
    "__pycache__",
    ".next",
    ".nuxt",
    "coverage",
    ".nyc_output",
    ".cache",
    ".turbo",
    ".angular"
];
const IGNORE_FILES = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".DS_Store",
    "Thumbs.db",
    ".gitignore",
    ".npmrc",
    ".editorconfig",
    ".prettierrc",
    ".eslintcache"
];
const PRIORITY_FOLDERS = ["src", "lib", "app", "pages", "components", "services", "utils", "tests", "test", "spec", "__tests__"];
const PRIORITY_FILES = ["package.json", "tsconfig.json", "README.md", "angular.json", "vite.config.ts", "next.config.js", "next.config.mjs"];
class FileStructureBuilder {
    options;
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    build(rootPath) {
        const rootName = path.basename(rootPath);
        const tree = this.buildTree(rootPath, 0);
        if (!tree) {
            return `${rootName}/\n  (empty or inaccessible)`;
        }
        const lines = [`${rootName}/`];
        this.renderTree(tree.children || [], "", lines);
        return lines.join("\n");
    }
    buildTree(dirPath, depth) {
        if (depth > this.options.maxDepth)
            return null;
        let entries;
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        }
        catch {
            return null;
        }
        const filtered = entries.filter(entry => {
            if (entry.name.startsWith(".") && entry.name !== ".github")
                return false;
            if (IGNORE_PATTERNS.includes(entry.name))
                return false;
            if (IGNORE_FILES.includes(entry.name))
                return false;
            return true;
        });
        const sorted = this.sortEntries(filtered);
        const limited = this.limitEntries(sorted, dirPath);
        const children = [];
        for (const entry of limited.entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                const childTree = this.buildTree(fullPath, depth + 1);
                const fileCount = this.options.showFileCount
                    ? this.countFiles(fullPath)
                    : undefined;
                children.push({
                    name: entry.name,
                    isDirectory: true,
                    children: childTree?.children,
                    fileCount
                });
            }
            else {
                children.push({
                    name: entry.name,
                    isDirectory: false
                });
            }
        }
        if (limited.truncated > 0) {
            children.push({
                name: `... and ${limited.truncated} more`,
                isDirectory: false
            });
        }
        return {
            name: path.basename(dirPath),
            isDirectory: true,
            children
        };
    }
    sortEntries(entries) {
        return entries.sort((a, b) => {
            // Directories first if prioritizeFolders is true
            if (this.options.prioritizeFolders) {
                if (a.isDirectory() && !b.isDirectory())
                    return -1;
                if (!a.isDirectory() && b.isDirectory())
                    return 1;
            }
            // Priority items first
            const aPriority = this.getPriority(a);
            const bPriority = this.getPriority(b);
            if (aPriority !== bPriority)
                return aPriority - bPriority;
            // Alphabetical
            return a.name.localeCompare(b.name);
        });
    }
    getPriority(entry) {
        if (entry.isDirectory()) {
            const idx = PRIORITY_FOLDERS.indexOf(entry.name.toLowerCase());
            return idx >= 0 ? idx : 100;
        }
        else {
            const idx = PRIORITY_FILES.indexOf(entry.name);
            return idx >= 0 ? idx : 100;
        }
    }
    limitEntries(entries, _dirPath) {
        if (entries.length <= this.options.maxItemsPerLevel) {
            return { entries, truncated: 0 };
        }
        const limited = entries.slice(0, this.options.maxItemsPerLevel);
        return {
            entries: limited,
            truncated: entries.length - this.options.maxItemsPerLevel
        };
    }
    countFiles(dirPath) {
        let count = 0;
        const walk = (dir) => {
            let entries;
            try {
                entries = fs.readdirSync(dir, { withFileTypes: true });
            }
            catch {
                return;
            }
            for (const entry of entries) {
                if (entry.name.startsWith(".") || IGNORE_PATTERNS.includes(entry.name)) {
                    continue;
                }
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fullPath);
                }
                else {
                    count++;
                }
            }
        };
        walk(dirPath);
        return count;
    }
    renderTree(nodes, prefix, lines) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isLast = i === nodes.length - 1;
            const connector = isLast ? "└── " : "├── ";
            const childPrefix = isLast ? "    " : "│   ";
            let label = node.name;
            if (node.isDirectory) {
                label += "/";
                if (node.fileCount !== undefined && node.fileCount > 0) {
                    label += ` (${node.fileCount} files)`;
                }
            }
            lines.push(`${prefix}${connector}${label}`);
            if (node.children && node.children.length > 0) {
                this.renderTree(node.children, prefix + childPrefix, lines);
            }
        }
    }
}
exports.FileStructureBuilder = FileStructureBuilder;
/**
 * Creates a compact structure summary for LLM context
 */
function buildCompactStructure(rootPath) {
    const builder = new FileStructureBuilder({
        maxDepth: 3,
        maxItemsPerLevel: 12,
        showFileCount: true,
        prioritizeFolders: true
    });
    return builder.build(rootPath);
}
//# sourceMappingURL=fileStructureBuilder.js.map