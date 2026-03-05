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
export declare function buildSmartContext(input: SmartContextInput): string;
export {};
