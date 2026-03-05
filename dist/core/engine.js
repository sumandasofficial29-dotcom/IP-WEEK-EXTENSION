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
exports.PromptEngine = void 0;
const vscode = __importStar(require("vscode"));
const repoScanner_1 = require("../intelligence/repoScanner");
const promptAssembler_1 = require("../assembler/promptAssembler");
const intentResolver_1 = require("../intent/intentResolver");
const fileRelevanceScorer_1 = require("../intelligence/context/fileRelevanceScorer");
const smartContextBuilder_1 = require("../intelligence/context/smartContextBuilder");
const contextMode_1 = require("../intelligence/context/contextMode");
class PromptEngine {
    scanner = new repoScanner_1.RepoScanner();
    assembler = new promptAssembler_1.PromptAssembler();
    resolver = new intentResolver_1.IntentResolver();
    async generate(root, userInput) {
        // 1. Scan repository for deep insights
        const scan = await this.scanner.scan(root);
        // 2. Detect scenario from user input
        const scenario = this.resolver.resolve(userInput);
        // 3. Detect context mode (explanation, feature, bugfix, etc.)
        const mode = (0, contextMode_1.detectContextMode)(userInput);
        // 4. Get active editor file info
        const activeEditor = vscode.window.activeTextEditor;
        const activeFilePath = activeEditor?.document.uri.fsPath;
        // 5. Score and select relevant files based on task + active file
        const relevantFiles = (0, fileRelevanceScorer_1.scoreFiles)(userInput, scan.structure.classes, activeFilePath);
        // 6. Build smart context with mode awareness
        const smartContext = (0, smartContextBuilder_1.buildSmartContext)({
            task: userInput,
            classes: scan.structure.classes,
            relevantFiles,
            activeFilePath,
            activeFileContent: activeEditor?.document.getText(),
            mode
        });
        // 7. Assemble contextual prompt with smart context
        const basePrompt = this.assembler.assemble(userInput, scan, scenario);
        return smartContext
            ? `${basePrompt}\n\n${smartContext}`
            : basePrompt;
    }
}
exports.PromptEngine = PromptEngine;
//# sourceMappingURL=engine.js.map