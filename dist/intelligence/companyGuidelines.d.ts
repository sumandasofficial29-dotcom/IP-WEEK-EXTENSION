/**
 * Company-specific coding guidelines by language
 * These are condensed actionable rules extracted from corporate standards
 */
export interface LanguageGuidelines {
    language: string;
    guidelines: string;
}
/**
 * Get company coding guidelines for a specific language
 */
export declare function getCompanyGuidelines(primaryLanguage: string): string | null;
/**
 * Check if guidelines exist for a language
 */
export declare function hasCompanyGuidelines(primaryLanguage: string): boolean;
