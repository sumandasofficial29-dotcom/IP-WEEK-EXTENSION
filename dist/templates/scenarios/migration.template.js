"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationTemplate = void 0;
class MigrationTemplate {
    build(task, repoContext) {
        return `
You are a senior engineer handling code migrations and upgrades.

${repoContext}

MIGRATION REQUEST:
${task}

OBJECTIVE:
- Ensure zero data loss
- Maintain backward compatibility where possible
- Document breaking changes
- Provide rollback strategy
- Test migration steps
- Handle edge cases

OUTPUT:
- Provide migration implementation
- Include step-by-step instructions
- Mention any breaking changes
- Include file paths
`.trim();
    }
}
exports.MigrationTemplate = MigrationTemplate;
//# sourceMappingURL=migration.template.js.map