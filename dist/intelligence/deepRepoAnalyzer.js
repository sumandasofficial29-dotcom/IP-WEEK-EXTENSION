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
exports.DeepRepoAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DeepRepoAnalyzer {
    analyze(root) {
        let files;
        try {
            files = fs.readdirSync(root);
        }
        catch {
            return {
                hasAngular: false,
                hasReact: false,
                hasSCSS: false,
                hasRouting: false,
                hasStateManagement: false,
                hasAngularMaterial: false
            };
        }
        const hasAngular = files.includes("angular.json");
        const hasReact = files.includes("vite.config.ts") ||
            files.includes("next.config.js") ||
            files.includes("next.config.mjs");
        // Check for Angular Material in package.json
        const packageJsonPath = path.join(root, "package.json");
        let hasAngularMaterial = false;
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
                hasAngularMaterial = pkg.dependencies?.["@angular/material"] !== undefined;
            }
            catch {
                // Ignore parsing errors
            }
        }
        const srcPath = path.join(root, "src");
        let hasSCSS = false;
        let hasRouting = false;
        let hasState = false;
        if (fs.existsSync(srcPath)) {
            const walk = (dir) => {
                let entries;
                try {
                    entries = fs.readdirSync(dir);
                }
                catch {
                    return;
                }
                for (const file of entries) {
                    const full = path.join(dir, file);
                    try {
                        if (fs.statSync(full).isDirectory()) {
                            walk(full);
                        }
                        else {
                            if (file.endsWith(".scss"))
                                hasSCSS = true;
                            if (file.includes("routing"))
                                hasRouting = true;
                            if (file.includes("store") || file.includes("state"))
                                hasState = true;
                        }
                    }
                    catch {
                        continue;
                    }
                }
            };
            walk(srcPath);
        }
        return {
            hasAngular,
            hasReact,
            hasSCSS,
            hasRouting,
            hasStateManagement: hasState,
            hasAngularMaterial,
            testFramework: files.includes("karma.conf.js")
                ? "Karma"
                : files.includes("jest.config.js") || files.includes("jest.config.ts")
                    ? "Jest"
                    : undefined
        };
    }
}
exports.DeepRepoAnalyzer = DeepRepoAnalyzer;
//# sourceMappingURL=deepRepoAnalyzer.js.map