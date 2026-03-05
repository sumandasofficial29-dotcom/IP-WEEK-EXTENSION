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
exports.ProjectRootDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectRootDetector {
    detect(workspaceRoot) {
        const candidates = [];
        const walk = (dir, depth) => {
            if (depth > 3)
                return;
            let entries;
            try {
                entries = fs.readdirSync(dir);
            }
            catch {
                return;
            }
            if (entries.includes("angular.json") ||
                entries.includes("package.json") ||
                entries.includes("next.config.js") ||
                entries.includes("vite.config.ts")) {
                candidates.push(dir);
            }
            for (const entry of entries) {
                const full = path.join(dir, entry);
                try {
                    if (fs.statSync(full).isDirectory() &&
                        !entry.startsWith(".") &&
                        entry !== "node_modules" &&
                        entry !== "dist") {
                        walk(full, depth + 1);
                    }
                }
                catch {
                    continue;
                }
            }
        };
        walk(workspaceRoot, 0);
        if (candidates.length === 0)
            return workspaceRoot;
        // Prefer deeper folders (likely actual app)
        candidates.sort((a, b) => b.length - a.length);
        return candidates[0];
    }
}
exports.ProjectRootDetector = ProjectRootDetector;
//# sourceMappingURL=projectRootDetector.js.map