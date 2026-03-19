import * as vscode from "vscode";
export declare class SidebarProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    private engine;
    constructor(extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView): void;
    /**
     * Generate cryptographically secure nonce for CSP
     */
    private getNonce;
    private getHtml;
}
