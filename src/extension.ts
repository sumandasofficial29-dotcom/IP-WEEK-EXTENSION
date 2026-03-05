import * as vscode from "vscode";
import { SidebarProvider } from "./ui/sidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "repoPrompt.sidebar",
      sidebarProvider
    )
  );
}

export function deactivate() {}