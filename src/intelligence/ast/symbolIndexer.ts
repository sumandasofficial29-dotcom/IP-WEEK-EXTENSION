import * as ts from "typescript";
import { parseFile } from "./astParser";
import { ClassInfo, MethodInfo } from "./types";

export function extractClasses(filePath: string): ClassInfo[] {
  const sourceFile = parseFile(filePath);
  if (!sourceFile) return [];

  // Store in const to help TypeScript narrow the type in nested function
  const sf: ts.SourceFile = sourceFile;
  const classes: ClassInfo[] = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;

      // Extract decorators
      const decorators: string[] = [];
      const modifiers = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
      if (modifiers) {
        for (const decorator of modifiers) {
          decorators.push(decorator.getText(sf));
        }
      }

      const methods: MethodInfo[] = [];

      node.members.forEach(member => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const name = member.name.getText(sf);

          const parameters = member.parameters.map(p =>
            p.name.getText(sf)
          );

          const returnType = member.type?.getText(sf) || "void";

          methods.push({
            name,
            parameters,
            returnType
          });
        }
      });

      const constructorParams: string[] = [];
      node.members.forEach(member => {
        if (ts.isConstructorDeclaration(member)) {
          member.parameters.forEach(p => {
            constructorParams.push(p.type?.getText(sf) || "any");
          });
        }
      });

      classes.push({
        name: className,
        filePath,
        decorators,
        methods,
        constructorParams
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);

  return classes;
}
