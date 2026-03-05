import { IntentCategory } from "../core/types";

export class IntentDetector {
  detect(input: string): IntentCategory {
    const text = input.toLowerCase();

    if (/(fix|bug|error|issue|crash)/.test(text))
      return IntentCategory.BUGFIX;

    if (/(test|unit test|integration|spec)/.test(text))
      return IntentCategory.TESTING;

    if (/(refactor|cleanup|improve structure)/.test(text))
      return IntentCategory.REFACTOR;

    if (/(optimize|performance|speed|memory)/.test(text))
      return IntentCategory.OPTIMIZATION;

    if (/(document|comment|readme|docstring)/.test(text))
      return IntentCategory.DOCUMENTATION;

    if (/(migrate|convert|upgrade|translate)/.test(text))
      return IntentCategory.MIGRATION;

    if (/(secure|auth|encrypt|validate|sanitize)/.test(text))
      return IntentCategory.SECURITY;

    if (/(docker|ci|pipeline|deploy|terraform)/.test(text))
      return IntentCategory.DEVOPS;

    if (/(explain|what does|how does)/.test(text))
      return IntentCategory.EXPLANATION;

    if (/(sql|query|database|schema|orm)/.test(text))
      return IntentCategory.DATABASE;

    if (/(regex|regular expression)/.test(text))
      return IntentCategory.REGEX;

    if (/(accessibility|aria|i18n|localization)/.test(text))
      return IntentCategory.ACCESSIBILITY;

    return IntentCategory.FEATURE;
  }
}
