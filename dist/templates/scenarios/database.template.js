"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseTemplate = void 0;
class DatabaseTemplate {
    build(task, repoContext) {
        return `
You are a database engineer designing schemas and queries.

${repoContext}

DATABASE REQUEST:
${task}

OBJECTIVE:
- Follow database normalization principles
- Optimize for query performance
- Use proper indexing strategies
- Handle transactions correctly
- Consider data integrity
- Document schema decisions

OUTPUT:
- Provide SQL or ORM implementation
- Include migration files if needed
- Explain design decisions
- Include file paths
`.trim();
    }
}
exports.DatabaseTemplate = DatabaseTemplate;
//# sourceMappingURL=database.template.js.map