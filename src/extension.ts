import * as vscode from "vscode";
import { SidebarProvider } from "./ui/sidebarProvider";
import { cacheManager } from "./intelligence/cacheManager";

export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('PromptCraft is now active!');
    vscode.window.showInformationMessage('PromptCraft activating...');

    // Initialize cache manager with extension context for persistence
    cacheManager.initialize(context);
    console.log('PromptCraft Cache initialized');
  
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "repoPrompt.sidebar",
      sidebarProvider
    )
  );

  // Register command for manual trigger
  const generateCommand = vscode.commands.registerCommand(
    "repoPrompt.generate",
    () => {
      vscode.window.showInformationMessage(
        "Open the PromptCraft sidebar from the Activity Bar!"
      );
    }
  );

  // Register command to show cache statistics (simple timing)
  const cacheStatsCommand = vscode.commands.registerCommand(
    "repoPrompt.cacheStats",
    () => {
      const stats = cacheManager.getStats();
      
      if (stats.lastScanTimeMs === 0) {
        vscode.window.showInformationMessage(
          "PromptCraft: No prompts generated yet.\n\n" +
          "Generate a prompt first, then check stats.",
          { modal: true }
        );
        return;
      }
      
      const cacheStatus = stats.lastScanWasCached ? "(from cache)" : "(fresh scan)";
      
      vscode.window.showInformationMessage(
        `PromptCraft Performance:\n\n` +
        `Last scan: ${stats.lastScanTimeMs}ms ${cacheStatus}`,
        { modal: true }
      );
    }
  );

  // Register command to clear cache
  const clearCacheCommand = vscode.commands.registerCommand(
    "repoPrompt.clearCache",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        "Clear all PromptCraft cache? This will force a fresh scan on next use.",
        "Clear Cache",
        "Cancel"
      );
      
      if (confirm === "Clear Cache") {
        cacheManager.clearAll();
        vscode.window.showInformationMessage("PromptCraft cache cleared successfully!");
      }
    }
  );

  context.subscriptions.push(generateCommand, cacheStatsCommand, clearCacheCommand);
  
  console.log('PromptCraft sidebar and cache commands registered');
  vscode.window.showInformationMessage('PromptCraft activated successfully!');
  } catch (error) {
    console.error('PromptCraft activation failed:', error);
    vscode.window.showErrorMessage(`PromptCraft failed to activate: ${error}`);
  }
}

export function deactivate() {
  // Log cache stats on deactivation
  const stats = cacheManager.getStats();
  console.log(`PromptCraft deactivated. Cache stats: ${stats.hits} hits, ${stats.misses} misses (${stats.hitRate}% hit rate)`);
}