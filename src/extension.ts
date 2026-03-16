import * as vscode from "vscode";
import { SidebarProvider } from "./ui/sidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Repo Intelligence Prompt Engine is now active!');
  
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
        "Open the Repo Prompt sidebar from the Activity Bar!"
      );
    }
  );

  context.subscriptions.push(generateCommand);
  
  console.log('Repo Intelligence Prompt Engine sidebar registered');
}

export function deactivate() {
  console.log('Repo Intelligence Prompt Engine deactivated');
}