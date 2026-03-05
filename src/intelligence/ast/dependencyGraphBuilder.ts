import * as ts from "typescript";
import { parseFile } from "./astParser";

export function extractImports(filePath: string): string[] {
  const sourceFile = parseFile(filePath);
  if (!sourceFile) return [];

  const imports: string[] = [];

  sourceFile.forEachChild(node => {
    if (ts.isImportDeclaration(node)) {
      const module = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, "");
      imports.push(module);
    }
  });

  return imports;
}

export interface DependencyNode {
  filePath: string;
  imports: string[];
}

export function buildDependencyGraph(filePaths: string[]): DependencyNode[] {
  return filePaths.map(filePath => ({
    filePath,
    imports: extractImports(filePath)
  }));
}
