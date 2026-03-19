import { DetectorContext } from "./detectorContext";
/**
 * Detect primary programming language
 */
export declare function detectPrimaryLanguage(context: DetectorContext): string;
/**
 * Detect all languages with percentages
 */
export declare function detectLanguages(context: DetectorContext): {
    name: string;
    percentage: number;
}[];
