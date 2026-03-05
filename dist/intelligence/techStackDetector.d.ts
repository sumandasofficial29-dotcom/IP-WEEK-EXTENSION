export interface TechStackInfo {
    framework?: string;
    testing?: string;
    styling?: string;
    buildTool?: string;
}
export declare class TechStackDetector {
    detect(deps: Record<string, string>): TechStackInfo;
}
