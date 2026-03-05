"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptAssembler = void 0;
const templateRegistry_1 = require("../templates/templateRegistry");
const contextCompressor_1 = require("../intelligence/contextCompressor");
class PromptAssembler {
    templateRegistry = new templateRegistry_1.TemplateRegistry();
    compressor = new contextCompressor_1.ContextCompressor();
    assemble(task, scan, scenario) {
        const repoContext = this.compressor.compress(scan);
        const insights = scan.insights;
        const framework = insights.hasAngular
            ? "Angular"
            : insights.hasReact
                ? "React"
                : "TypeScript";
        const testFramework = insights.testFramework || "Jest";
        const template = this.templateRegistry.getTemplate(scenario, framework, task, repoContext, testFramework);
        return `
${repoContext}

${template}
`.trim();
    }
}
exports.PromptAssembler = PromptAssembler;
//# sourceMappingURL=promptAssembler.js.map