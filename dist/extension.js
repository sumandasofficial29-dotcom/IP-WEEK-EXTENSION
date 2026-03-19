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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sidebarProvider_1 = require("./ui/sidebarProvider");
const cacheManager_1 = require("./intelligence/cacheManager");
function activate(context) {
    try {
        console.log('PromptCraft is now active!');
        vscode.window.showInformationMessage('PromptCraft activating...');
        // Initialize cache manager with extension context for persistence
        cacheManager_1.cacheManager.initialize(context);
        console.log('PromptCraft Cache initialized');
        const sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri);
        context.subscriptions.push(vscode.window.registerWebviewViewProvider("repoPrompt.sidebar", sidebarProvider));
        // Register command for manual trigger
        const generateCommand = vscode.commands.registerCommand("repoPrompt.generate", () => {
            vscode.window.showInformationMessage("Open the PromptCraft sidebar from the Activity Bar!");
        });
        // Register command to show cache statistics (simple timing)
        const cacheStatsCommand = vscode.commands.registerCommand("repoPrompt.cacheStats", () => {
            const stats = cacheManager_1.cacheManager.getStats();
            if (stats.lastScanTimeMs === 0) {
                vscode.window.showInformationMessage("PromptCraft: No prompts generated yet.\n\n" +
                    "Generate a prompt first, then check stats.", { modal: true });
                return;
            }
            const cacheStatus = stats.lastScanWasCached ? "(from cache)" : "(fresh scan)";
            vscode.window.showInformationMessage(`PromptCraft Performance:\n\n` +
                `Last scan: ${stats.lastScanTimeMs}ms ${cacheStatus}`, { modal: true });
        });
        // Register command to clear cache
        const clearCacheCommand = vscode.commands.registerCommand("repoPrompt.clearCache", async () => {
            const confirm = await vscode.window.showWarningMessage("Clear all PromptCraft cache? This will force a fresh scan on next use.", "Clear Cache", "Cancel");
            if (confirm === "Clear Cache") {
                cacheManager_1.cacheManager.clearAll();
                vscode.window.showInformationMessage("PromptCraft cache cleared successfully!");
            }
        });
        context.subscriptions.push(generateCommand, cacheStatsCommand, clearCacheCommand);
        console.log('PromptCraft sidebar and cache commands registered');
        vscode.window.showInformationMessage('PromptCraft activated successfully!');
    }
    catch (error) {
        console.error('PromptCraft activation failed:', error);
        vscode.window.showErrorMessage(`PromptCraft failed to activate: ${error}`);
    }
}
function deactivate() {
    // Log cache stats on deactivation
    const stats = cacheManager_1.cacheManager.getStats();
    console.log(`PromptCraft deactivated. Cache stats: ${stats.hits} hits, ${stats.misses} misses (${stats.hitRate}% hit rate)`);
}
//# sourceMappingURL=extension.js.map