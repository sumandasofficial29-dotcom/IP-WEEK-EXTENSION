import * as vscode from "vscode";
import { PromptEngine } from "../core/engine";
import { PromptOptions } from "../templates/focusedPromptGenerator";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private engine = new PromptEngine();

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    // Generate nonce for Content Security Policy
    const nonce = this.getNonce();
    webviewView.webview.html = this.getHtml(nonce);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      const workspace = vscode.workspace.workspaceFolders?.[0];

      if (!workspace) {
        vscode.window.showErrorMessage("No workspace open.");
        webviewView.webview.postMessage({ command: "error", message: "No workspace open." });
        return;
      }

      const root = workspace.uri.fsPath;

      // Handle FOCUSED mode generation (new approach)
      if (message.command === "generateFocused") {
        try {
          webviewView.webview.postMessage({ command: "loading" });

          const options: Partial<PromptOptions> = {
            includeExplanation: message.options?.includeExplanation ?? true,
            includeDocumentation: message.options?.includeDocumentation ?? false,
            includeTests: message.options?.includeTests ?? false,
            includeProjectInstructions: message.options?.includeProjectInstructions ?? true,
            additionalContext: message.options?.additionalContext
          };

          const result = await this.engine.generateFocused(root, message.text, options);

          webviewView.webview.postMessage({
            command: "focusedResult",
            content: result.prompt,
            sections: result.sections,
            metadata: result.metadata,
            options: result.options,
            taskAction: result.taskAnalysis.action
          });
        } catch (error) {
          webviewView.webview.postMessage({
            command: "error",
            message: String(error)
          });
        }
      }

      // Handle CLASSIC mode generation (old approach)
      if (message.command === "generate") {
        try {
          webviewView.webview.postMessage({ command: "loading" });

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

      // Handle regenerate with custom options
      if (message.command === "regenerateWithOptions") {
        try {
          webviewView.webview.postMessage({ command: "loading" });

          const prompt = await this.engine.generateWithOptions(
            root,
            message.text,
            message.options,
            message.additionalContext
          );

          webviewView.webview.postMessage({
            command: "customResult",
            content: prompt
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
          let sent = false;
          
          try {
            await vscode.commands.executeCommand("workbench.action.chat.open", {
              query: prompt,
              isPartialQuery: false
            });
            sent = true;
          } catch { /* fallback */ }
          
          if (!sent) {
            try {
              await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
              setTimeout(async () => {
                try {
                  await vscode.commands.executeCommand("workbench.action.chat.insertIntoInput", prompt);
                } catch { /* clipboard fallback already done */ }
              }, 200);
              sent = true;
            } catch { /* continue */ }
          }
          
          if (!sent) {
            const fallbackCommands = [
              "github.copilot.chat.focus",
              "workbench.action.chat.openInEditor"
            ];
            for (const cmd of fallbackCommands) {
              try {
                await vscode.commands.executeCommand(cmd);
                sent = true;
                break;
              } catch { continue; }
            }
          }
          
          if (sent) {
            vscode.window.showInformationMessage("Prompt sent to Copilot Chat!");
          } else {
            vscode.window.showInformationMessage("Prompt copied! Press Ctrl+Shift+I to open Copilot Chat, then Ctrl+V.");
          }
        } catch {
          vscode.window.showInformationMessage("Prompt copied! Open Copilot Chat and paste with Ctrl+V.");
        }
      }
    });
  }

  /**
   * Generate cryptographically secure nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getHtml(nonce: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      padding: 12px;
      color: var(--vscode-foreground);
    }
    h3 {
      font-size: 14px;
      margin-bottom: 10px;
      color: var(--vscode-foreground);
    }
    
    /* Input */
    textarea {
      width: 100%;
      min-height: 80px;
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
    
    /* Options */
    .options-section {
      margin-top: 10px;
      padding: 10px;
      background: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      border: 1px solid var(--vscode-input-border);
    }
    .options-title {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    .option-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      font-size: 11px;
    }
    .option-row input[type="checkbox"] {
      margin: 0;
    }
    .option-row label {
      cursor: pointer;
      color: var(--vscode-foreground);
    }
    
    /* Additional Context */
    .additional-context {
      margin-top: 10px;
    }
    .additional-context textarea {
      min-height: 50px;
      font-size: 11px;
    }
    .additional-context-label {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
      display: block;
    }
    
    /* Buttons */
    .btn {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
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
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Output */
    .output-section {
      margin-top: 12px;
    }
    #output {
      width: 100%;
      min-height: 120px;
      max-height: 400px;
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
      line-height: 1.5;
    }
    
    /* Editable output */
    #editableOutput {
      width: 100%;
      min-height: 200px;
      max-height: 400px;
      padding: 10px;
      border: 1px solid var(--vscode-focusBorder);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      resize: vertical;
      line-height: 1.5;
    }
    
    /* Actions */
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .actions .btn {
      flex: 1;
      margin-top: 0;
    }
    
    /* Metadata */
    .metadata {
      margin-top: 8px;
      padding: 8px;
      background: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }
    .metadata-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .meta-item {
      display: flex;
      gap: 4px;
    }
    .meta-value { font-weight: 500; }
    .meta-value.good { color: #4caf50; }
    
    /* Edit Toggle */
    .edit-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .edit-toggle-label {
      font-size: 11px;
      font-weight: 500;
    }
    .edit-btn {
      padding: 4px 8px;
      font-size: 10px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    
    /* Loading */
    .loading {
      color: var(--vscode-textLink-foreground);
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
    
    /* Error */
    .error {
      color: var(--vscode-errorForeground);
      padding: 10px;
    }
    
    .hidden { display: none; }
    
    /* Tip */
    .tip {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
      padding: 6px;
      background: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      border-left: 2px solid var(--vscode-textLink-foreground);
    }
  </style>
</head>
<body>
  <h3>✨ PromptCraft</h3>
  
  <!-- Input -->
  <textarea id="input" placeholder="What do you want to do? e.g., 'fix the login bug' or 'add user authentication'"></textarea>
  
  <!-- Options -->
  <div class="options-section">
    <div class="options-title">⚙️ Prompt Options</div>
    
    <div class="option-row">
      <input type="checkbox" id="optExplanation" checked>
      <label for="optExplanation">Request step-by-step explanation</label>
    </div>
    
    <div class="option-row">
      <input type="checkbox" id="optDocumentation">
      <label for="optDocumentation">Generate documentation</label>
    </div>
    
    <div class="option-row">
      <input type="checkbox" id="optTests">
      <label for="optTests">Include unit tests</label>
    </div>
    
    <div class="option-row">
      <input type="checkbox" id="optProjectInstructions" checked>
      <label for="optProjectInstructions">Use project instructions (if available)</label>
    </div>
    
    <div class="additional-context">
      <label class="additional-context-label">📝 Additional context (optional):</label>
      <textarea id="additionalContext" placeholder="Add constraints, requirements, or specific details..."></textarea>
    </div>
  </div>
  
  <!-- Tip -->
  <div class="tip" id="tip">
    💡 Copilot already sees your code. This generates an optimized prompt with expert role + clear requirements.
  </div>
  
  <!-- Generate Button -->
  <button id="generateBtn" class="btn btn-primary">⚡ Generate Prompt</button>
  
  <!-- Output Section -->
  <div class="output-section">
    <!-- Metadata -->
    <div id="metadata" class="metadata hidden">
      <div class="metadata-row">
        <span class="meta-item"><span>📦</span> <span class="meta-value" id="metaLanguage">--</span></span>
        <span class="meta-item"><span>🔧</span> <span class="meta-value" id="metaFrameworks">--</span></span>
        <span class="meta-item"><span>📄</span> <span class="meta-value" id="metaInstructions">--</span></span>
      </div>
      <div class="metadata-row" style="margin-top: 4px;">
        <span class="meta-item"><span>📁</span> <span class="meta-value" id="metaRepoContext">--</span></span>
        <span class="meta-item"><span>🔗</span> <span class="meta-value" id="metaDependencies">--</span></span>
      </div>
    </div>
    
    <!-- Edit Toggle -->
    <div class="edit-toggle hidden" id="editToggle">
      <span class="edit-toggle-label">Generated Prompt</span>
      <button class="edit-btn" id="editBtn">✏️ Edit</button>
    </div>
    
    <!-- Output (Read-only) -->
    <div id="output"></div>
    
    <!-- Editable Output -->
    <textarea id="editableOutput" class="hidden"></textarea>
    
    <!-- Actions -->
    <div class="actions hidden" id="actions">
      <button class="btn btn-secondary" id="copyBtn">📋 Copy</button>
      <button class="btn btn-primary" id="sendToCopilotBtn">💬 Send to Copilot</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let latestPrompt = '';
    let isEditing = false;

    // Security: HTML escape function
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // DOM Elements
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const editableOutput = document.getElementById('editableOutput');
    const actions = document.getElementById('actions');
    const generateBtn = document.getElementById('generateBtn');
    const metadata = document.getElementById('metadata');
    const editToggle = document.getElementById('editToggle');
    const editBtn = document.getElementById('editBtn');
    const tip = document.getElementById('tip');
    
    // Options
    const optExplanation = document.getElementById('optExplanation');
    const optDocumentation = document.getElementById('optDocumentation');
    const optTests = document.getElementById('optTests');
    const optProjectInstructions = document.getElementById('optProjectInstructions');
    const additionalContext = document.getElementById('additionalContext');

    // Generate
    generateBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) {
        output.innerHTML = '<span class="error">⚠️ Please enter a task description.</span>';
        return;
      }
      
      vscode.postMessage({
        command: 'generateFocused',
        text,
        options: {
          includeExplanation: optExplanation.checked,
          includeDocumentation: optDocumentation.checked,
          includeTests: optTests.checked,
          includeProjectInstructions: optProjectInstructions.checked,
          additionalContext: additionalContext.value.trim() || undefined
        }
      });
    });

    // Ctrl+Enter to generate
    input.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        generateBtn.click();
      }
    });

    // Toggle edit mode
    function toggleEdit() {
      isEditing = !isEditing;
      if (isEditing) {
        editableOutput.value = latestPrompt;
        output.classList.add('hidden');
        editableOutput.classList.remove('hidden');
        editBtn.textContent = '✓ Done';
      } else {
        latestPrompt = editableOutput.value;
        output.textContent = latestPrompt;
        output.classList.remove('hidden');
        editableOutput.classList.add('hidden');
        editBtn.textContent = '✏️ Edit';
      }
    }

    // Copy
    function copy() {
      const text = isEditing ? editableOutput.value : latestPrompt;
      if (text) {
        vscode.postMessage({ command: 'copy', text });
      }
    }

    // Send to Copilot
    function sendToCopilot() {
      const text = isEditing ? editableOutput.value : latestPrompt;
      if (text) {
        vscode.postMessage({ command: 'sendToCopilot', text });
      }
    }

    // Event Listeners
    editBtn.addEventListener('click', toggleEdit);
    document.getElementById('copyBtn').addEventListener('click', copy);
    document.getElementById('sendToCopilotBtn').addEventListener('click', sendToCopilot);

    // Handle messages
    window.addEventListener('message', event => {
      const msg = event.data;

      if (msg.command === 'loading') {
        output.innerHTML = '<span class="loading">⚙️ Generating optimized prompt...</span>';
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        actions.classList.add('hidden');
        metadata.classList.add('hidden');
        editToggle.classList.add('hidden');
        tip.classList.add('hidden');
      }

      if (msg.command === 'focusedResult') {
        latestPrompt = msg.content;
        output.textContent = msg.content;
        output.classList.remove('hidden');
        editableOutput.classList.add('hidden');
        isEditing = false;
        editBtn.textContent = '✏️ Edit';
        
        // Update metadata - basic info
        document.getElementById('metaLanguage').textContent = msg.metadata.primaryLanguage || '--';
        document.getElementById('metaFrameworks').textContent = msg.metadata.frameworks.slice(0, 2).join(', ') || 'None';
        const instrStatus = msg.metadata.hasProjectInstructions ? '✓ Instructions' : '✗ No instructions';
        document.getElementById('metaInstructions').textContent = instrStatus;
        document.getElementById('metaInstructions').classList.toggle('good', msg.metadata.hasProjectInstructions);
        
        // Update metadata - context from classic mode
        const repoStatus = msg.metadata.hasRepoContext ? '✓ Repo Context' : '✗ No context';
        document.getElementById('metaRepoContext').textContent = repoStatus;
        document.getElementById('metaRepoContext').classList.toggle('good', msg.metadata.hasRepoContext);
        
        const depStatus = msg.metadata.hasDependencyAnalysis ? '✓ Deps Analyzed' : '○ No deps';
        document.getElementById('metaDependencies').textContent = depStatus;
        document.getElementById('metaDependencies').classList.toggle('good', msg.metadata.hasDependencyAnalysis);
        
        metadata.classList.remove('hidden');
        editToggle.classList.remove('hidden');
        actions.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = '⚡ Generate Prompt';
      }

      if (msg.command === 'error') {
        output.innerHTML = '<span class="error">❌ ' + escapeHtml(msg.message) + '</span>';
        generateBtn.disabled = false;
        generateBtn.textContent = '⚡ Generate Prompt';
        tip.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
    `;
  }
}
