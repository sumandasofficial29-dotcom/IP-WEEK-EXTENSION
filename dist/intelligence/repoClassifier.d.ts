import { RepoFile } from "../core/types";
export type ArchitectureType = "monolith" | "layered" | "component-based" | "unknown";
export declare class RepoClassifier {
    classify(files: RepoFile[]): ArchitectureType;
}
