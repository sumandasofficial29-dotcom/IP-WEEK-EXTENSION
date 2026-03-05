"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRegistry = void 0;
const scenarioBlueprints_1 = require("./scenarioBlueprints");
class TemplateRegistry {
    getTemplate(scenario, framework, task, repoContext, testFramework) {
        const blueprint = scenarioBlueprints_1.ScenarioBlueprints[scenario] ||
            scenarioBlueprints_1.ScenarioBlueprints["feature"];
        return blueprint
            .replace(/{{framework}}/g, framework)
            .replace(/{{task}}/g, task)
            .replace(/{{repoContext}}/g, repoContext)
            .replace(/{{testFramework}}/g, testFramework || "Jest");
    }
}
exports.TemplateRegistry = TemplateRegistry;
//# sourceMappingURL=templateRegistry.js.map