import * as vscode from "vscode";
import { PromptEngine } from "../core/engine";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private engine = new PromptEngine();

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "generate") {
        const workspace = vscode.workspace.workspaceFolders?.[0];

        if (!workspace) {
          vscode.window.showErrorMessage("No workspace open.");
          return;
        }

        try {
          webviewView.webview.postMessage({ command: "loading" });

          const root = workspace.uri.fsPath;
          const prompt = await this.engine.generate(root, message.text);

          webviewView.webview.postMessage({
            command: "result",
            content: prompt,
            score: 85
          });
        } catch (error) {
          webviewView.webview.postMessage({
            command: "error",
            message: String(error)
          });
        }
      }

      if (message.command === "copy") {
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage("Copied to clipboard!");
      }

      if (message.command === "sendToCopilot") {
        await vscode.env.clipboard.writeText(message.text);
        try {
          // Try different Copilot commands
          const commands = await vscode.commands.getCommands();
          if (commands.includes("workbench.panel.chat.view.copilot.focus")) {
            await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
          } else if (commands.includes("github.copilot.chat.focus")) {
            await vscode.commands.executeCommand("github.copilot.chat.focus");
          } else if (commands.includes("workbench.action.chat.open")) {
            await vscode.commands.executeCommand("workbench.action.chat.open");
          }
          vscode.window.showInformationMessage("Prompt copied! Paste it in Copilot Chat.");
        } catch (err) {
          vscode.window.showInformationMessage("Prompt copied to clipboard! Open Copilot Chat to paste.");
        }
      }
    });
  }

  private getHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      padding: 12px;
      color: var(--vscode-foreground);
    }
    h3 {
      font-size: 14px;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    .subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }
    textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
      resize: vertical;
    }
    textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .btn {
      width: 100%;
      padding: 8px;
      margin-top: 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .output-section {
      margin-top: 12px;
    }
    #output {
      width: 100%;
      min-height: 120px;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-textBlockQuote-background);
      color: var(--vscode-foreground);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-y: auto;
      max-height: 300px;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .actions .btn {
      flex: 1;
      margin-top: 0;
    }
    .score {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    .loading {
      color: var(--vscode-textLink-foreground);
      font-style: italic;
    }
    .error {
      color: var(--vscode-errorForeground);
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <h3>🚀 Smart Prompt Builder</h3>
  <p class="subtitle">Generate context-aware prompts for Copilot</p>
  
  <textarea id="input" placeholder="Describe what you want to build..."></textarea>
  <button id="generateBtn" class="btn btn-primary">Generate Prompt</button>
  
  <div class="output-section">
    <div id="output"></div>
    <div id="score" class="score hidden"></div>
    <div class="actions hidden" id="actions">
      <button class="btn btn-secondary" onclick="copy()">📋 Copy</button>
      <button class="btn btn-primary" onclick="sendToCopilot()">💬 Send to Copilot</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let latestPrompt = "";

    const input = document.getElementById("input");
    const output = document.getElementById("output");
    const score = document.getElementById("score");
    const actions = document.getElementById("actions");
    const generateBtn = document.getElementById("generateBtn");

    generateBtn.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) {
        output.innerHTML = '<span class="error">Please enter a prompt.</span>';
        return;
      }
      vscode.postMessage({ command: "generate", text });
    });

    function copy() {
      if (latestPrompt) {
        vscode.postMessage({ command: "copy", text: latestPrompt });
      }
    }

    function sendToCopilot() {
      if (latestPrompt) {
        vscode.postMessage({ command: "sendToCopilot", text: latestPrompt });
      }
    }

    window.addEventListener("message", event => {
      const msg = event.data;

      if (msg.command === "loading") {
        output.innerHTML = '<span class="loading">Analyzing repository and generating prompt...</span>';
        generateBtn.disabled = true;
        actions.classList.add("hidden");
        score.classList.add("hidden");
      }

      if (msg.command === "result") {
        latestPrompt = msg.content;
        output.textContent = msg.content;
        score.textContent = "Quality Score: " + Math.round(msg.score) + "%";
        score.classList.remove("hidden");
        actions.classList.remove("hidden");
        generateBtn.disabled = false;
      }

      if (msg.command === "error") {
        output.innerHTML = '<span class="error">Error: ' + msg.message + '</span>';
        generateBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
    `;
  }
}
