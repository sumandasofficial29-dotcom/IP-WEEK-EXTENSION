export type ContextMode = "explanation" | "feature" | "bugfix" | "testing" | "refactor";
export declare function detectContextMode(task: string): ContextMode;
