"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevOpsTemplate = void 0;
class DevOpsTemplate {
    build(task, repoContext) {
        return `
You are a DevOps engineer setting up infrastructure and CI/CD.

${repoContext}

DEVOPS REQUEST:
${task}

OBJECTIVE:
- Follow infrastructure-as-code principles
- Ensure reproducibility
- Implement proper secrets management
- Set up monitoring and logging
- Consider scalability
- Document deployment steps

OUTPUT:
- Provide configuration files
- Include setup instructions
- Mention any required environment variables
- Include file paths
`.trim();
    }
}
exports.DevOpsTemplate = DevOpsTemplate;
//# sourceMappingURL=devops.template.js.map