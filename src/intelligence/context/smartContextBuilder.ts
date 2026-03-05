import { ClassInfo } from "../ast/types";
import { ContextMode } from "./contextMode";

interface SmartContextInput {
  task: string;
  classes: ClassInfo[];
  relevantFiles: string[];
  activeFilePath?: string;
  activeFileContent?: string;
  mode: ContextMode;
}

export function buildSmartContext(
  input: SmartContextInput
): string {
  const {
    classes,
    relevantFiles,
    activeFilePath,
    activeFileContent,
    mode
  } = input;

  const relevantClasses = classes.filter(c =>
    relevantFiles.includes(c.filePath)
  );

  const activeClass = relevantClasses.find(
    c => c.filePath === activeFilePath
  );

  let context = `### Repository Structural Intelligence\n`;

  // 🔥 EXPLANATION MODE
  if (mode === "explanation" && activeFileContent) {
    context += `
## 📄 Active File Analysis
File: ${activeFilePath}

Full Content:
${activeFileContent}

Instructions:
- Provide structural breakdown
- Explain class responsibilities
- Explain method responsibilities
- Describe dependency usage
- Identify potential improvements
`;
    return context.trim();
  }

  // 🔥 FEATURE / BUG / REFACTOR MODE

  if (activeClass) {
    context += `
## 🎯 Primary Target
Class: ${activeClass.name}
File: ${activeClass.filePath}

Decorators:
${activeClass.decorators.join(", ") || "None"}

Constructor Dependencies:
${activeClass.constructorParams.join(", ") || "None"}

Methods:
${activeClass.methods
  .map(
    m =>
      `- ${m.name}(${m.parameters.join(", ")}) : ${m.returnType}`
  )
  .join("\n")}
`;
  }

  // Inject ONLY truly related classes
  const secondary = relevantClasses
    .filter(c => c.filePath !== activeFilePath)
    .slice(0, 3);

  if (secondary.length > 0) {
    context += `\n## 🔗 Related Entities\n`;

    for (const cls of secondary) {
      context += `
Class: ${cls.name}
File: ${cls.filePath}
Methods:
${cls.methods.map(m => `- ${m.name}()`).join("\n")}
`;
    }
  }

  context += `
### Architectural Rules
- Preserve public APIs
- Maintain dependency injection integrity
- Avoid breaking changes
- Follow Angular best practices
`;

  return context.trim();
}
