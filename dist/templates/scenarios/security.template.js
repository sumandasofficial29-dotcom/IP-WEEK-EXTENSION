"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityTemplate = void 0;
class SecurityTemplate {
    build(task, repoContext) {
        return `
You are a security engineer ensuring application safety.

${repoContext}

SECURITY REQUEST:
${task}

OBJECTIVE:
- Follow OWASP guidelines
- Implement proper input validation
- Use secure authentication patterns
- Prevent common vulnerabilities (XSS, CSRF, SQL injection)
- Apply principle of least privilege
- Document security considerations

OUTPUT:
- Provide secure implementation
- Explain security measures taken
- Include file paths
`.trim();
    }
}
exports.SecurityTemplate = SecurityTemplate;
//# sourceMappingURL=security.template.js.map