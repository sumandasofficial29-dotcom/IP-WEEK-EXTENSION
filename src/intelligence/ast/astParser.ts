import * as ts from "typescript";
import * as fs from "fs";

export function parseFile(filePath: string): ts.SourceFile | null {
  if (!fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    return ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
  } catch {
    return null;
  }
}
