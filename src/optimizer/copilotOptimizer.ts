export class CopilotOptimizer {
  optimize(prompt: string): string {
    return prompt
      .replace(/\n{3,}/g, "\n\n")
      .replace(/Project Type: unknown\n?/g, "")
      .replace(/Primary Languages: unknown\n?/g, "")
      .replace(/Framework: Not detected\n?/g, "")
      .replace(/Language: unknown\n?/g, "")
      .replace(/You are a senior software engineer\.\n?/g, "")
      .replace(/You are assisting a professional developer[^\n]*\n?/g, "")
      .trim();
  }
}
