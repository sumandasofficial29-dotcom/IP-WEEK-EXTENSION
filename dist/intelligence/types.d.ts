export interface DeepRepoProfile {
    framework?: string;
    language: string;
    platform: "frontend" | "backend" | "fullstack" | "library";
    styling?: string;
    testing?: string;
    stateManagement?: string;
    buildTool?: string;
    hasSSR: boolean;
    fileStats: Record<string, number>;
}
