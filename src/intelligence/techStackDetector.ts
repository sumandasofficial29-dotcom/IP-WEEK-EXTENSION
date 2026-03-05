import { FrameworkPatterns } from "./frameworkPatterns";

export interface TechStackInfo {
  framework?: string;
  testing?: string;
  styling?: string;
  buildTool?: string;
}

export class TechStackDetector {
  detect(deps: Record<string, string>): TechStackInfo {
    const keys = Object.keys(deps);

    const detectMatch = (patterns: string[]) =>
      patterns.some(p => keys.includes(p));

    const result: TechStackInfo = {};

    if (detectMatch(FrameworkPatterns.angular)) result.framework = "Angular";
    if (detectMatch(FrameworkPatterns.react)) result.framework = "React";
    if (detectMatch(FrameworkPatterns.next)) result.framework = "Next.js";
    if (detectMatch(FrameworkPatterns.vue)) result.framework = "Vue";
    if (detectMatch(FrameworkPatterns.nest)) result.framework = "NestJS";

    if (detectMatch(FrameworkPatterns.jest)) result.testing = "Jest";
    if (detectMatch(FrameworkPatterns.karma)) result.testing = "Karma";

    if (detectMatch(FrameworkPatterns.tailwind)) result.styling = "TailwindCSS";
    if (detectMatch(FrameworkPatterns.bootstrap)) result.styling = "Bootstrap";

    return result;
  }
}
