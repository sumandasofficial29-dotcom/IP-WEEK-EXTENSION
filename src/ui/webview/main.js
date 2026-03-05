(function () {
  const vscode = acquireVsCodeApi();

  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("promptInput");
  const outputSection = document.getElementById("output");

  generateBtn.addEventListener("click", () => {
    const userInput = promptInput.value.trim();

    if (!userInput) {
      vscode.postMessage({
        command: "showMessage",
        text: "Please enter a prompt first."
      });
      return;
    }

    // Trigger the generate command
    vscode.postMessage({
      command: "generate",
      text: userInput
    });

    outputSection.innerHTML = "<p class='loading'>Generating prompt...</p>";
  });

  // Handle messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.command) {
      case "showResult":
        outputSection.innerHTML = `<pre>${message.content}</pre>`;
        break;
      case "showError":
        outputSection.innerHTML = `<p class='error'>${message.error}</p>`;
        break;
    }
  });
})();
