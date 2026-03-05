"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentDetector = void 0;
const types_1 = require("../core/types");
class IntentDetector {
    detect(input) {
        const text = input.toLowerCase();
        if (/(fix|bug|error|issue|crash)/.test(text))
            return types_1.IntentCategory.BUGFIX;
        if (/(test|unit test|integration|spec)/.test(text))
            return types_1.IntentCategory.TESTING;
        if (/(refactor|cleanup|improve structure)/.test(text))
            return types_1.IntentCategory.REFACTOR;
        if (/(optimize|performance|speed|memory)/.test(text))
            return types_1.IntentCategory.OPTIMIZATION;
        if (/(document|comment|readme|docstring)/.test(text))
            return types_1.IntentCategory.DOCUMENTATION;
        if (/(migrate|convert|upgrade|translate)/.test(text))
            return types_1.IntentCategory.MIGRATION;
        if (/(secure|auth|encrypt|validate|sanitize)/.test(text))
            return types_1.IntentCategory.SECURITY;
        if (/(docker|ci|pipeline|deploy|terraform)/.test(text))
            return types_1.IntentCategory.DEVOPS;
        if (/(explain|what does|how does)/.test(text))
            return types_1.IntentCategory.EXPLANATION;
        if (/(sql|query|database|schema|orm)/.test(text))
            return types_1.IntentCategory.DATABASE;
        if (/(regex|regular expression)/.test(text))
            return types_1.IntentCategory.REGEX;
        if (/(accessibility|aria|i18n|localization)/.test(text))
            return types_1.IntentCategory.ACCESSIBILITY;
        return types_1.IntentCategory.FEATURE;
    }
}
exports.IntentDetector = IntentDetector;
//# sourceMappingURL=intentDetector.js.map