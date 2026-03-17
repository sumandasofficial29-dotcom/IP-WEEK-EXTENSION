import * as fs from "fs";
import * as path from "path";

export interface FileStructureOptions {
  maxDepth: number;
  maxItemsPerLevel: number;
  showFileCount: boolean;
  prioritizeFolders: boolean;
}

interface TreeNode {
  name: string;
  isDirectory: boolean;
  children?: TreeNode[];
  fileCount?: number;
}

const DEFAULT_OPTIONS: FileStructureOptions = {
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

export class FileStructureBuilder {
  private options: FileStructureOptions;

  constructor(options: Partial<FileStructureOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  build(rootPath: string): string {
    const rootName = path.basename(rootPath);
    const tree = this.buildTree(rootPath, 0);

    if (!tree) {
      return `${rootName}/\n  (empty or inaccessible)`;
    }

    const lines: string[] = [`${rootName}/`];
    this.renderTree(tree.children || [], "", lines);
    return lines.join("\n");
  }

  private buildTree(dirPath: string, depth: number): TreeNode | null {
    if (depth > this.options.maxDepth) return null;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return null;
    }

    const filtered = entries.filter(entry => {
      if (entry.name.startsWith(".") && entry.name !== ".github") return false;
      if (IGNORE_PATTERNS.includes(entry.name)) return false;
      if (IGNORE_FILES.includes(entry.name)) return false;
      return true;
    });

    const sorted = this.sortEntries(filtered);
    const limited = this.limitEntries(sorted, dirPath);

    const children: TreeNode[] = [];

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
      } else {
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

  private sortEntries(entries: fs.Dirent[]): fs.Dirent[] {
    return entries.sort((a, b) => {
      // Directories first if prioritizeFolders is true
      if (this.options.prioritizeFolders) {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
      }

      // Priority items first
      const aPriority = this.getPriority(a);
      const bPriority = this.getPriority(b);
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Alphabetical
      return a.name.localeCompare(b.name);
    });
  }

  private getPriority(entry: fs.Dirent): number {
    if (entry.isDirectory()) {
      const idx = PRIORITY_FOLDERS.indexOf(entry.name.toLowerCase());
      return idx >= 0 ? idx : 100;
    } else {
      const idx = PRIORITY_FILES.indexOf(entry.name);
      return idx >= 0 ? idx : 100;
    }
  }

  private limitEntries(entries: fs.Dirent[], _dirPath: string): { entries: fs.Dirent[]; truncated: number } {
    if (entries.length <= this.options.maxItemsPerLevel) {
      return { entries, truncated: 0 };
    }

    const limited = entries.slice(0, this.options.maxItemsPerLevel);
    return {
      entries: limited,
      truncated: entries.length - this.options.maxItemsPerLevel
    };
  }

  private countFiles(dirPath: string): number {
    let count = 0;

    const walk = (dir: string) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.name.startsWith(".") || IGNORE_PATTERNS.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          count++;
        }
      }
    };

    walk(dirPath);
    return count;
  }

  private renderTree(nodes: TreeNode[], prefix: string, lines: string[]): void {
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

/**
 * Creates a compact structure summary for LLM context
 */
export function buildCompactStructure(rootPath: string): string {
  const builder = new FileStructureBuilder({
    maxDepth: 3,
    maxItemsPerLevel: 12,
    showFileCount: true,
    prioritizeFolders: true
  });

  return builder.build(rootPath);
}

/**
 * Creates a detailed structure for deep analysis
 */
export function buildDetailedStructure(rootPath: string): string {
  const builder = new FileStructureBuilder({
    maxDepth: 5,
    maxItemsPerLevel: 20,
    showFileCount: true,
    prioritizeFolders: true
  });

  return builder.build(rootPath);
}
