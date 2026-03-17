"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextCompressor = void 0;
const enhancedTechStackDetector_1 = require("./enhancedTechStackDetector");
class ContextCompressor {
    techStack = null;
    compress(scan) {
        // Use enhanced tech stack detection
        const detector = new enhancedTechStackDetector_1.EnhancedTechStackDetector(scan.projectRoot);
        this.techStack = detector.analyze();
        return this.buildFormattedContext(scan, this.techStack);
    }
    buildFormattedContext(scan, tech) {
        const sections = [];
        // Project Info
        sections.push(this.formatProjectInfo(scan, tech));
        // Tech Stack
        sections.push(this.formatTechStack(tech));
        // Architecture
        sections.push(this.formatArchitecture(tech));
        // Dependencies (categorized)
        sections.push(this.formatDependencies(tech));
        // Repository Structure
        sections.push(this.formatStructure(scan));
        return sections.join("\n\n");
    }
    formatProjectInfo(scan, tech) {
        const lines = [
            "# Project Overview",
            "",
            `**Root:** \`${scan.projectRoot}\``,
            `**Type:** ${tech.projectType}`,
            `**Primary Language:** ${tech.primaryLanguage}`
        ];
        if (tech.languages.length > 1) {
            const langBreakdown = tech.languages
                .slice(0, 4)
                .map(l => `${l.name} (${l.percentage}%)`)
                .join(", ");
            lines.push(`**Languages:** ${langBreakdown}`);
        }
        return lines.join("\n");
    }
    formatTechStack(tech) {
        const lines = ["# Technology Stack", ""];
        // Frameworks
        if (tech.frameworks.length > 0) {
            lines.push("## Frameworks");
            for (const fw of tech.frameworks.slice(0, 3)) {
                const version = fw.version ? ` v${fw.version}` : "";
                const confidence = fw.confidence >= 80 ? "✓" : `(${fw.confidence}% confidence)`;
                lines.push(`- **${fw.name}**${version} ${confidence}`);
                if (fw.indicators.length > 0 && fw.confidence < 100) {
                    lines.push(`  - Evidence: ${fw.indicators.slice(0, 2).join(", ")}`);
                }
            }
            lines.push("");
        }
        // Build & Tooling
        const build = tech.architecture.build;
        if (build.bundler || build.transpiler) {
            lines.push("## Build Tooling");
            if (build.bundler)
                lines.push(`- **Bundler:** ${build.bundler}`);
            if (build.transpiler)
                lines.push(`- **Transpiler:** ${build.transpiler}`);
            lines.push("");
        }
        // Styling
        const styling = tech.architecture.styling;
        if (styling.framework || styling.preprocessor || styling.methodology) {
            lines.push("## Styling");
            if (styling.framework)
                lines.push(`- **UI Framework:** ${styling.framework}`);
            if (styling.preprocessor)
                lines.push(`- **Preprocessor:** ${styling.preprocessor}`);
            if (styling.methodology)
                lines.push(`- **Methodology:** ${styling.methodology}`);
            lines.push("");
        }
        // Testing
        const testing = tech.architecture.testing;
        if (testing.framework || testing.e2e) {
            lines.push("## Testing");
            if (testing.framework)
                lines.push(`- **Unit Testing:** ${testing.framework}`);
            if (testing.e2e)
                lines.push(`- **E2E Testing:** ${testing.e2e}`);
            if (testing.coverage)
                lines.push(`- **Coverage:** ${testing.coverage}`);
            lines.push("");
        }
        return lines.join("\n").trim();
    }
    formatArchitecture(tech) {
        const lines = ["# Architecture", ""];
        // Patterns
        if (tech.architecture.patterns.length > 0) {
            lines.push("## Detected Patterns");
            for (const pattern of tech.architecture.patterns) {
                lines.push(`- ${pattern}`);
            }
            lines.push("");
        }
        // State Management
        const state = tech.architecture.stateManagement;
        if (state.library) {
            lines.push("## State Management");
            lines.push(`- **Library:** ${state.library}`);
            if (state.pattern)
                lines.push(`- **Pattern:** ${state.pattern}`);
            lines.push("");
        }
        // Routing
        const routing = tech.architecture.routing;
        if (routing.type) {
            lines.push("## Routing");
            lines.push(`- **Type:** ${routing.type}`);
            if (routing.routes.length > 0) {
                lines.push(`- **Routes:** ${routing.routes.slice(0, 5).join(", ")}${routing.routes.length > 5 ? "..." : ""}`);
            }
            lines.push("");
        }
        // API
        const api = tech.architecture.api;
        if (api.client || api.style) {
            lines.push("## API Layer");
            if (api.style)
                lines.push(`- **Style:** ${api.style}`);
            if (api.client)
                lines.push(`- **Client:** ${api.client}`);
            lines.push("");
        }
        return lines.join("\n").trim();
    }
    formatDependencies(tech) {
        const lines = ["# Dependencies", ""];
        const deps = tech.dependencies;
        // Show by category (only non-empty categories)
        const importantCategories = [
            "Core Framework",
            "State Management",
            "HTTP/API",
            "UI Components",
            "Forms",
            "Routing"
        ];
        for (const category of importantCategories) {
            const categoryDeps = deps.byCategory[category];
            if (categoryDeps && categoryDeps.length > 0) {
                const depList = categoryDeps
                    .slice(0, 5)
                    .map(d => `\`${d.name}@${d.version}\``)
                    .join(", ");
                lines.push(`**${category}:** ${depList}`);
            }
        }
        // Show total counts
        lines.push("");
        lines.push(`> Total: ${deps.production.length} production, ${deps.development.length} dev dependencies`);
        return lines.join("\n");
    }
    formatStructure(scan) {
        return `# Repository Structure

\`\`\`
${scan.fileTree}
\`\`\``;
    }
    getTechStack() {
        return this.techStack;
    }
}
exports.ContextCompressor = ContextCompressor;
//# sourceMappingURL=contextCompressor.js.map