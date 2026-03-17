"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentResolver = void 0;
exports.resolveIntent = resolveIntent;
// Helper to create typed patterns
function pattern(scenario, keywords, phrases, priority) {
    return { scenario, keywords, phrases, priority };
}
const INTENT_PATTERNS = [
    // === HIGH PRIORITY: Specific technical tasks ===
    pattern("security", ["vulnerability", "exploit", "xss", "csrf", "injection", "sanitize", "encrypt", "decrypt", "hash", "jwt", "oauth", "cors", "csp"], ["security audit", "penetration test", "secure the", "fix vulnerability", "authentication flow", "authorization check", "sql injection", "cross site"], 100),
    pattern("accessibility", ["aria", "a11y", "wcag", "screenreader", "voiceover", "nvda", "jaws"], ["accessibility audit", "keyboard navigation", "focus management", "color contrast", "alt text", "screen reader", "assistive technology"], 100),
    pattern("regex", ["regex", "regexp"], ["regular expression", "match pattern", "capture group", "lookahead", "lookbehind"], 100),
    pattern("database", ["sql", "mysql", "postgres", "mongodb", "redis", "prisma", "typeorm", "sequelize", "knex", "drizzle"], ["database query", "db schema", "data model", "table design", "index optimization", "query performance", "join tables", "foreign key", "primary key", "migration script"], 95),
    pattern("devops", ["docker", "kubernetes", "k8s", "jenkins", "terraform", "ansible", "helm", "nginx", "apache"], ["ci/cd", "ci cd", "continuous integration", "continuous deployment", "deploy to", "pipeline config", "container image", "docker compose", "environment variable", "load balancer", "reverse proxy", "github actions", "gitlab ci"], 95),
    // === MEDIUM-HIGH: Core development tasks ===
    pattern("bugfix", ["bug", "fix", "broken", "crash", "failing", "failed", "issue", "problem", "wrong", "incorrect"], ["not working", "doesn't work", "does not work", "stopped working", "throwing error", "getting error", "unexpected behavior", "should be", "supposed to", "used to work", "regression", "root cause"], 90),
    pattern("testing", ["test", "spec", "jest", "mocha", "jasmine", "karma", "cypress", "playwright", "vitest", "coverage", "mock", "stub", "spy"], ["unit test", "integration test", "e2e test", "end to end", "test case", "test coverage", "write tests", "add tests", "test file", "test suite", "test driven", "tdd"], 85),
    pattern("refactor", ["refactor", "restructure", "reorganize", "simplify", "cleanup", "decouple", "extract", "inline"], ["code smell", "technical debt", "make it cleaner", "better structure", "split into", "move to", "rename to", "consolidate", "reduce complexity", "apply pattern", "solid principles", "clean up"], 85),
    pattern("optimization", ["optimize", "performance", "faster", "slower", "speed", "memory", "cache", "lazy", "bundle", "minify"], ["too slow", "takes too long", "reduce load time", "improve performance", "memory leak", "cpu usage", "bundle size", "tree shaking", "code splitting", "lazy loading", "memoization"], 85),
    // === MEDIUM: Knowledge and documentation ===
    pattern("explanation", ["explain", "understand", "confused", "unclear", "means", "purpose"], ["what does", "how does", "why does", "why is", "what is", "walk me through", "help me understand", "can you explain", "tell me about", "break down", "step by step", "how it works", "what happens when"], 80),
    pattern("documentation", ["document", "readme", "jsdoc", "tsdoc", "typedoc", "swagger", "openapi", "wiki"], ["add comments", "write documentation", "api docs", "code comments", "inline documentation", "generate docs", "document this", "add jsdoc"], 80),
    pattern("learning", ["learn", "teach", "tutorial", "beginner", "example", "demo", "guide", "howto"], ["how to", "teach me", "show me how", "getting started", "step by step guide", "for beginners", "simple example", "best practices"], 75),
    // === MEDIUM: Specialized tasks ===
    pattern("migration", ["migrate", "upgrade", "convert", "port", "transition", "deprecate"], ["upgrade from", "migrate from", "convert to", "move from", "switch to", "update to version", "breaking changes", "backwards compatible"], 75),
    pattern("review", ["review", "feedback", "evaluate", "assess", "audit", "analyze"], ["code review", "pr review", "pull request", "look at this", "what do you think", "is this correct", "any issues", "suggestions for"], 70),
    pattern("commit", ["commit", "changelog", "versioning"], ["commit message", "git commit", "conventional commit", "semantic version", "release notes", "change log"], 70),
    pattern("data", ["json", "xml", "csv", "yaml", "serialize", "deserialize", "mapping", "etl"], ["data transformation", "parse data", "convert json", "data mapping", "extract data", "format data", "data pipeline", "data validation"], 70),
    pattern("pseudocode", ["pseudocode", "algorithm", "flowchart"], ["write algorithm", "design algorithm", "logic flow", "step by step logic", "algorithmic approach"], 70),
    // === LOWER: Collaboration and rapid work ===
    pattern("prototype", ["prototype", "poc", "mvp", "draft", "sketch", "spike"], ["proof of concept", "quick prototype", "rough draft", "just make it work", "minimum viable", "throw together", "rapid prototype"], 60),
    pattern("pair", ["collaborate", "partner"], ["pair programming", "work together", "think together", "let's build", "help me build", "code along", "pair with"], 50),
    // === DEFAULT: Feature development (lowest priority, most common) ===
    pattern("feature", ["create", "add", "implement", "build", "make", "develop", "new", "feature", "component", "service", "module", "function", "endpoint", "api", "page", "form", "button", "modal", "dialog"], ["add a", "create a", "implement a", "build a", "new feature", "add feature", "i need", "i want"], 10)
].sort((a, b) => b.priority - a.priority); // Sort by priority descending
function resolveIntent(prompt) {
    const lower = prompt.toLowerCase();
    // Check each pattern in priority order
    for (const pattern of INTENT_PATTERNS) {
        // Check phrases first (more specific)
        for (const phrase of pattern.phrases) {
            if (lower.includes(phrase)) {
                return pattern.scenario;
            }
        }
        // Then check keywords
        for (const keyword of pattern.keywords) {
            if (lower.includes(keyword)) {
                return pattern.scenario;
            }
        }
    }
    // Default to feature if nothing matches
    return "feature";
}
class IntentResolver {
    resolve(input) {
        return resolveIntent(input);
    }
}
exports.IntentResolver = IntentResolver;
//# sourceMappingURL=intentResolver.js.map