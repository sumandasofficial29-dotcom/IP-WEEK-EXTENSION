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
exports.RepoScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const projectRootDetector_1 = require("./projectRootDetector");
const dependencyAnalyzer_1 = require("./dependencyAnalyzer");
const deepRepoAnalyzer_1 = require("./deepRepoAnalyzer");
const symbolIndexer_1 = require("./ast/symbolIndexer");
const dependencyGraphBuilder_1 = require("./ast/dependencyGraphBuilder");
class RepoScanner {
    rootDetector = new projectRootDetector_1.ProjectRootDetector();
    depAnalyzer = new dependencyAnalyzer_1.DependencyAnalyzer();
    deepAnalyzer = new deepRepoAnalyzer_1.DeepRepoAnalyzer();
    async scan(workspaceRoot) {
        const projectRoot = this.rootDetector.detect(workspaceRoot);
        const dependencies = this.depAnalyzer.analyze(projectRoot);
        const insights = this.deepAnalyzer.analyze(projectRoot);
        const tsFiles = this.collectTsFiles(projectRoot);
        const structure = this.buildStructure(tsFiles);
        const dependencyGraph = (0, dependencyGraphBuilder_1.buildDependencyGraph)(tsFiles);
        return {
            projectRoot,
            dependencies,
            insights,
            fileTree: this.buildTree(projectRoot, 3),
            isAngular: insights.hasAngular,
            isReact: insights.hasReact,
            structure,
            dependencyGraph
        };
    }
    collectTsFiles(dir, files = []) {
        let entries;
        try {
            entries = fs.readdirSync(dir);
        }
        catch {
            return files;
        }
        for (const entry of entries) {
            if (entry.startsWith(".") || entry === "node_modules" || entry === "dist")
                continue;
            const fullPath = path.join(dir, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    this.collectTsFiles(fullPath, files);
                }
                else if (entry.endsWith(".ts") && !entry.endsWith(".spec.ts") && !entry.endsWith(".d.ts")) {
                    files.push(fullPath);
                }
            }
            catch {
                // skip inaccessible files
            }
        }
        return files;
    }
    buildStructure(tsFiles) {
        const allClasses = [];
        for (const file of tsFiles) {
            const classes = (0, symbolIndexer_1.extractClasses)(file);
            allClasses.push(...classes);
        }
        const services = allClasses.filter(c => c.decorators.some(d => d.includes("Injectable")));
        const components = allClasses.filter(c => c.decorators.some(d => d.includes("Component")));
        const utils = allClasses.filter(c => c.decorators.length === 0 && c.filePath.includes("util"));
        return {
            classes: allClasses,
            services,
            components,
            utils
        };
    }
    buildTree(dir, depth, prefix = "") {
        if (depth === 0)
            return [];
        let entries;
        try {
            entries = fs.readdirSync(dir);
        }
        catch {
            return [];
        }
        return entries
            .filter(f => !f.startsWith(".") && f !== "node_modules")
            .flatMap(file => {
            const full = path.join(dir, file);
            const current = prefix + file;
            try {
                if (fs.statSync(full).isDirectory()) {
                    return [current, ...this.buildTree(full, depth - 1, current + "/")];
                }
                return [current];
            }
            catch {
                return [current];
            }
        });
    }
}
exports.RepoScanner = RepoScanner;
//# sourceMappingURL=repoScanner.js.map