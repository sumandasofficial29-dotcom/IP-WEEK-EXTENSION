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
          const result = await this.engine.generate(root, message.text);

          webviewView.webview.postMessage({
            command: "result",
            content: result.prompt,
            score: result.qualityScore,
            scoreExplanation: result.qualityExplanation,
            inputIssues: result.inputIssues,
            suggestions: result.suggestions,
            qualityDetails: result.qualityDetails
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
        const prompt = message.text;
        await vscode.env.clipboard.writeText(prompt);
        
        try {
          // Try to open Copilot Chat with the prompt pre-filled
          // VS Code 1.83+ supports passing query to chat commands
          let sent = false;
          
          // Method 1: Open chat with query parameter (VS Code 1.83+)
          try {
            await vscode.commands.executeCommand("workbench.action.chat.open", {
              query: prompt,
              isPartialQuery: false
            });
            sent = true;
          } catch {
            // Fallback methods
          }
          
          if (!sent) {
            // Method 2: Try opening panel chat with query
            try {
              await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
              // Small delay then try to insert text
              setTimeout(async () => {
                try {
                  await vscode.commands.executeCommand("workbench.action.chat.insertIntoInput", prompt);
                } catch {
                  // Clipboard fallback already done
                }
              }, 200);
              sent = true;
            } catch {
              // Continue to next method
            }
          }
          
          if (!sent) {
            // Method 3: Just open any available chat
            const fallbackCommands = [
              "github.copilot.chat.focus",
              "workbench.action.chat.openInEditor"
            ];
            for (const cmd of fallbackCommands) {
              try {
                await vscode.commands.executeCommand(cmd);
                sent = true;
                break;
              } catch {
                continue;
              }
            }
          }
          
          if (sent) {
            vscode.window.showInformationMessage("Prompt sent to Copilot Chat!");
          } else {
            vscode.window.showInformationMessage("Prompt copied! Press Ctrl+Shift+I to open Copilot Chat, then Ctrl+V.");
          }
        } catch (err) {
          vscode.window.showInformationMessage("Prompt copied! Open Copilot Chat and paste with Ctrl+V.");
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
      margin-bottom: 4px;
      color: var(--vscode-foreground);
    }
    .subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 10px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
      resize: vertical;
      line-height: 1.4;
    }
    textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    textarea::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    .btn {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: opacity 0.2s;
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
      min-height: 150px;
      padding: 10px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-textBlockQuote-background);
      color: var(--vscode-foreground);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-y: auto;
      max-height: 400px;
      line-height: 1.5;
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
    .quality-section {
      margin-top: 10px;
      padding: 10px;
      border-radius: 4px;
      background: var(--vscode-textBlockQuote-background);
      border: 1px solid var(--vscode-input-border);
    }
    .quality-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .quality-score {
      font-size: 13px;
      font-weight: 600;
    }
    .quality-score.high { color: #4caf50; }
    .quality-score.medium { color: #ff9800; }
    .quality-score.low { color: #f44336; }
    .quality-bar {
      width: 100%;
      height: 4px;
      background: var(--vscode-progressBar-background);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .quality-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    .quality-bar-fill.high { background: #4caf50; }
    .quality-bar-fill.medium { background: #ff9800; }
    .quality-bar-fill.low { background: #f44336; }
    .quality-explanation {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }
    .suggestions {
      margin-top: 8px;
      font-size: 10px;
    }
    .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      margin-top: 4px;
      color: var(--vscode-textLink-foreground);
    }
    .suggestion-item::before {
      content: "💡";
      font-size: 10px;
    }
    .quality-dimensions {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .dimension {
      padding: 6px;
      border-radius: 4px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-input-border);
    }
    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
    }
    .dimension-name {
      font-weight: 500;
      color: var(--vscode-foreground);
    }
    .dimension-score {
      font-weight: 600;
    }
    .dimension-score.excellent { color: #4caf50; }
    .dimension-score.good { color: #8bc34a; }
    .dimension-score.fair { color: #ff9800; }
    .dimension-score.poor { color: #f44336; }
    .dimension-bar {
      height: 2px;
      margin-top: 3px;
      background: var(--vscode-progressBar-background);
      border-radius: 1px;
      overflow: hidden;
    }
    .dimension-bar-fill {
      height: 100%;
    }
    .dimension-bar-fill.excellent { background: #4caf50; }
    .dimension-bar-fill.good { background: #8bc34a; }
    .dimension-bar-fill.fair { background: #ff9800; }
    .dimension-bar-fill.poor { background: #f44336; }
    .likelihood-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 8px;
    }
    .likelihood-badge.High {
      background: #1b5e20;
      color: #a5d6a7;
    }
    .likelihood-badge.Medium {
      background: #e65100;
      color: #ffcc80;
    }
    .likelihood-badge.Low {
      background: #b71c1c;
      color: #ef9a9a;
    }
    .loading {
      color: var(--vscode-textLink-foreground);
      font-style: italic;
    }
    .loading-spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .error {
      color: var(--vscode-errorForeground);
    }
    .hidden { display: none; }
    .tip {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 6px;
      padding: 6px;
      background: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      border-left: 2px solid var(--vscode-textLink-foreground);
    }
    .stats {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <h3>✨ PromptCraft</h3>
  
  <textarea id="input" placeholder="Describe what you want to do..."></textarea>
  
  <div class="tip" id="tip">
    💡 <strong>Tip:</strong> Be specific about the component, file, or functionality you're working with.
  </div>
  
  <button id="generateBtn" class="btn btn-primary">⚡ Generate Prompt</button>
  
  <div class="output-section">
    <div id="qualitySection" class="quality-section hidden">
      <div class="quality-header">
        <span id="qualityLabel">Prompt Quality</span>
        <span>
          <span id="qualityScore" class="quality-score">--</span>
          <span id="likelihoodBadge" class="likelihood-badge hidden"></span>
        </span>
      </div>
      <div class="quality-bar">
        <div id="qualityBarFill" class="quality-bar-fill" style="width: 0%"></div>
      </div>
      <div id="qualityExplanation" class="quality-explanation"></div>
      <div id="qualityDimensions" class="quality-dimensions hidden"></div>
      <div id="suggestions" class="suggestions hidden"></div>
    </div>
    
    <div id="output"></div>
    
    <div id="stats" class="stats hidden">
      <div class="stat-item">📝 <span id="charCount">0</span> chars</div>
      <div class="stat-item">📄 <span id="lineCount">0</span> lines</div>
    </div>
    
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
    const actions = document.getElementById("actions");
    const generateBtn = document.getElementById("generateBtn");
    const qualitySection = document.getElementById("qualitySection");
    const qualityScore = document.getElementById("qualityScore");
    const qualityBarFill = document.getElementById("qualityBarFill");
    const qualityExplanation = document.getElementById("qualityExplanation");
    const qualityDimensions = document.getElementById("qualityDimensions");
    const likelihoodBadge = document.getElementById("likelihoodBadge");
    const suggestions = document.getElementById("suggestions");
    const stats = document.getElementById("stats");
    const charCount = document.getElementById("charCount");
    const lineCount = document.getElementById("lineCount");
    const tip = document.getElementById("tip");

    generateBtn.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) {
        output.innerHTML = '<span class="error">⚠️ Please enter a task description.</span>';
        return;
      }
      vscode.postMessage({ command: "generate", text });
    });

    // Allow Ctrl+Enter to generate
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        generateBtn.click();
      }
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

    function getQualityClass(score) {
      if (score >= 70) return "high";
      if (score >= 40) return "medium";
      return "low";
    }

    window.addEventListener("message", event => {
      const msg = event.data;

      if (msg.command === "loading") {
        output.innerHTML = '<span class="loading"><span class="loading-spinner">⚙️</span> Analyzing repository structure and generating intelligent prompt...</span>';
        generateBtn.disabled = true;
        generateBtn.textContent = "⏳ Analyzing...";
        actions.classList.add("hidden");
        qualitySection.classList.add("hidden");
        stats.classList.add("hidden");
        tip.classList.add("hidden");
      }

      if (msg.command === "result") {
        latestPrompt = msg.content;
        output.textContent = msg.content;
        
        // Update quality display
        const qClass = getQualityClass(msg.score);
        qualityScore.textContent = msg.score + "%";
        qualityScore.className = "quality-score " + qClass;
        qualityBarFill.style.width = msg.score + "%";
        qualityBarFill.className = "quality-bar-fill " + qClass;
        qualityExplanation.textContent = msg.scoreExplanation || "";
        
        // Show likelihood badge
        if (msg.qualityDetails && msg.qualityDetails.likelihood) {
          likelihoodBadge.textContent = msg.qualityDetails.likelihood + " success";
          likelihoodBadge.className = "likelihood-badge " + msg.qualityDetails.likelihood;
          likelihoodBadge.classList.remove("hidden");
        } else {
          likelihoodBadge.classList.add("hidden");
        }
        
        // Render quality dimensions
        if (msg.qualityDetails && msg.qualityDetails.dimensions) {
          qualityDimensions.innerHTML = msg.qualityDetails.dimensions
            .map(d => \`
              <div class="dimension">
                <div class="dimension-header">
                  <span class="dimension-name">\${d.name}</span>
                  <span class="dimension-score \${d.status}">\${d.score}%</span>
                </div>
                <div class="dimension-bar">
                  <div class="dimension-bar-fill \${d.status}" style="width: \${d.score}%"></div>
                </div>
              </div>
            \`).join("");
          qualityDimensions.classList.remove("hidden");
        } else {
          qualityDimensions.classList.add("hidden");
        }
        
        // Show suggestions if any
        if (msg.suggestions && msg.suggestions.length > 0) {
          suggestions.innerHTML = msg.suggestions
            .map(s => '<div class="suggestion-item">' + s + '</div>')
            .join("");
          suggestions.classList.remove("hidden");
        } else {
          suggestions.classList.add("hidden");
        }
        
        // Update stats
        charCount.textContent = msg.content.length.toLocaleString();
        lineCount.textContent = msg.content.split("\\n").length.toLocaleString();
        
        qualitySection.classList.remove("hidden");
        stats.classList.remove("hidden");
        actions.classList.remove("hidden");
        generateBtn.disabled = false;
        generateBtn.textContent = "⚡ Generate Prompt";
      }

      if (msg.command === "error") {
        output.innerHTML = '<span class="error">❌ Error: ' + msg.message + '</span>';
        generateBtn.disabled = false;
        generateBtn.textContent = "⚡ Generate Prompt";
        tip.classList.remove("hidden");
      }
    });
  </script>
</body>
</html>
    `;
  }
}
