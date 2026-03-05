import { RepoFile } from "../core/types";

export type ArchitectureType =
  | "monolith"
  | "layered"
  | "component-based"
  | "unknown";

export class RepoClassifier {
  classify(files: RepoFile[]): ArchitectureType {
    const paths = files.map(f => f.path);

    const hasControllers = paths.some(p =>
      p.includes("controllers")
    );

    const hasServices = paths.some(p =>
      p.includes("services")
    );

    const hasComponents = paths.some(p =>
      p.includes("components")
    );

    if (hasControllers && hasServices) return "layered";
    if (hasComponents) return "component-based";
    if (files.length > 800) return "monolith";

    return "unknown";
  }
}