"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedTechStackDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Framework signatures for detection
const FRAMEWORK_SIGNATURES = {
    Angular: {
        packages: ["@angular/core", "@angular/common"],
        files: ["angular.json"],
        codePatterns: [/@Component\s*\(/, /@Injectable\s*\(/]
    },
    React: {
        packages: ["react", "react-dom"],
        files: [],
        codePatterns: [/from\s+['"]react['"]/, /useState|useEffect/]
    },
    "Next.js": {
        packages: ["next"],
        files: ["next.config.js", "next.config.mjs", "next.config.ts"]
    },
    Vue: {
        packages: ["vue"],
        files: ["vue.config.js", "nuxt.config.js"]
    },
    Nuxt: {
        packages: ["nuxt"],
        files: ["nuxt.config.js", "nuxt.config.ts"]
    },
    Svelte: {
        packages: ["svelte"],
        files: ["svelte.config.js"]
    },
    SvelteKit: {
        packages: ["@sveltejs/kit"],
        files: ["svelte.config.js"]
    },
    Express: {
        packages: ["express"],
        files: [],
        codePatterns: [/express\s*\(\)/, /app\.(get|post|put)\s*\(/]
    },
    NestJS: {
        packages: ["@nestjs/core"],
        files: ["nest-cli.json"],
        codePatterns: [/@Controller\s*\(/, /@Module\s*\(/]
    },
    Fastify: {
        packages: ["fastify"],
        files: []
    },
    Koa: {
        packages: ["koa"],
        files: []
    },
    Hono: {
        packages: ["hono"],
        files: []
    },
    Electron: {
        packages: ["electron"],
        files: ["electron-builder.json"]
    },
    Tauri: {
        packages: ["@tauri-apps/api"],
        files: ["tauri.conf.json"]
    },
    "React Native": {
        packages: ["react-native"],
        files: ["app.json", "metro.config.js"]
    },
    Expo: {
        packages: ["expo"],
        files: ["app.json", "expo.json"]
    },
    Remix: {
        packages: ["@remix-run/react"],
        files: ["remix.config.js"]
    },
    Astro: {
        packages: ["astro"],
        files: ["astro.config.mjs"]
    },
    Gatsby: {
        packages: ["gatsby"],
        files: ["gatsby-config.js"]
    },
    Solid: {
        packages: ["solid-js"],
        files: []
    },
    Qwik: {
        packages: ["@builder.io/qwik"],
        files: []
    }
};
// State management libraries
const STATE_LIBRARIES = {
    NgRx: ["@ngrx/store", "@ngrx/effects"],
    Redux: ["redux", "@reduxjs/toolkit"],
    "Redux Toolkit": ["@reduxjs/toolkit"],
    MobX: ["mobx"],
    Zustand: ["zustand"],
    Jotai: ["jotai"],
    Recoil: ["recoil"],
    Vuex: ["vuex"],
    Pinia: ["pinia"],
    XState: ["xstate"],
    NGXS: ["@ngxs/store"],
    Akita: ["@datorama/akita"],
    Effector: ["effector"],
    Valtio: ["valtio"]
};
// Testing frameworks
const TEST_FRAMEWORKS = {
    Jest: { packages: ["jest"], configs: ["jest.config.js", "jest.config.ts"] },
    Vitest: { packages: ["vitest"], configs: ["vitest.config.ts"] },
    Karma: { packages: ["karma"], configs: ["karma.conf.js"] },
    Mocha: { packages: ["mocha"], configs: [".mocharc.js"] },
    Jasmine: { packages: ["jasmine"], configs: ["jasmine.json"] },
    AVA: { packages: ["ava"], configs: [] },
    Cypress: { packages: ["cypress"], configs: ["cypress.config.js", "cypress.config.ts"] },
    Playwright: { packages: ["@playwright/test"], configs: ["playwright.config.ts"] },
    Puppeteer: { packages: ["puppeteer"], configs: [] },
    "Testing Library": { packages: ["@testing-library/react", "@testing-library/angular"], configs: [] }
};
// Styling detection
const STYLING_LIBS = {
    TailwindCSS: ["tailwindcss"],
    "Bootstrap": ["bootstrap"],
    "Material UI": ["@mui/material"],
    "Angular Material": ["@angular/material"],
    "Chakra UI": ["@chakra-ui/react"],
    "Ant Design": ["antd"],
    "Styled Components": ["styled-components"],
    Emotion: ["@emotion/react"],
    "CSS Modules": [],
    SCSS: ["sass", "node-sass"],
    LESS: ["less"],
    Stylus: ["stylus"],
    "PrimeNG": ["primeng"],
    "PrimeReact": ["primereact"],
    Radix: ["@radix-ui/react-dialog"],
    "Shadcn/ui": ["@radix-ui/react-slot"]
};
// Build tools
const BUILD_TOOLS = {
    Webpack: { packages: ["webpack"], configs: ["webpack.config.js"] },
    Vite: { packages: ["vite"], configs: ["vite.config.ts", "vite.config.js"] },
    Rollup: { packages: ["rollup"], configs: ["rollup.config.js"] },
    Parcel: { packages: ["parcel"], configs: [] },
    esbuild: { packages: ["esbuild"], configs: [] },
    SWC: { packages: ["@swc/core"], configs: [".swcrc"] },
    Turbopack: { packages: ["turbopack"], configs: [] },
    Nx: { packages: ["nx"], configs: ["nx.json"] },
    Turborepo: { packages: ["turbo"], configs: ["turbo.json"] }
};
// Dependency categorization
const DEPENDENCY_CATEGORIES = {
    "Core Framework": ["react", "vue", "@angular/core", "svelte", "next", "nuxt"],
    "State Management": ["redux", "@ngrx/store", "mobx", "zustand", "vuex", "pinia", "recoil", "jotai"],
    "Routing": ["react-router", "@angular/router", "vue-router"],
    "HTTP/API": ["axios", "node-fetch", "got", "ky", "@tanstack/react-query", "swr", "apollo-client"],
    "Forms": ["formik", "react-hook-form", "@angular/forms", "vee-validate", "yup", "zod"],
    "UI Components": ["@mui/material", "@angular/material", "antd", "@chakra-ui/react", "primeng"],
    "Styling": ["tailwindcss", "styled-components", "@emotion/react", "sass"],
    "Animation": ["framer-motion", "gsap", "@angular/animations", "animejs", "lottie-web"],
    "Charts/Visualization": ["chart.js", "d3", "recharts", "highcharts", "echarts", "plotly.js"],
    "Date/Time": ["moment", "dayjs", "date-fns", "luxon"],
    "Utilities": ["lodash", "ramda", "rxjs", "immer"],
    "Testing": ["jest", "vitest", "mocha", "cypress", "playwright", "@testing-library/react"],
    "Build Tools": ["webpack", "vite", "rollup", "esbuild", "turbo"],
    "Linting/Formatting": ["eslint", "prettier", "stylelint"],
    "Type Safety": ["typescript", "zod", "io-ts", "class-validator"]
};
class EnhancedTechStackDetector {
    rootPath;
    packageJson = null;
    allDeps = [];
    depVersions = {};
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.loadPackageJson();
    }
    loadPackageJson() {
        const pkgPath = path.join(this.rootPath, "package.json");
        if (fs.existsSync(pkgPath)) {
            try {
                this.packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
                const deps = this.packageJson.dependencies || {};
                const devDeps = this.packageJson.devDependencies || {};
                const peerDeps = this.packageJson.peerDependencies || {};
                this.depVersions = { ...deps, ...devDeps, ...peerDeps };
                this.allDeps = Object.keys(this.depVersions);
            }
            catch {
                this.packageJson = null;
            }
        }
    }
    analyze() {
        return {
            frameworks: this.detectFrameworks(),
            primaryLanguage: this.detectPrimaryLanguage(),
            languages: this.detectLanguages(),
            architecture: this.analyzeArchitecture(),
            dependencies: this.categorizeDependencies(),
            projectType: this.detectProjectType()
        };
    }
    detectFrameworks() {
        const detected = [];
        for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
            let confidence = 0;
            const indicators = [];
            // Check packages
            for (const pkg of sig.packages) {
                if (this.allDeps.includes(pkg)) {
                    confidence += 50;
                    indicators.push(`package: ${pkg}`);
                }
            }
            // Check config files
            for (const file of sig.files) {
                if (fs.existsSync(path.join(this.rootPath, file))) {
                    confidence += 40;
                    indicators.push(`config: ${file}`);
                }
            }
            if (confidence > 0) {
                detected.push({
                    name,
                    version: this.getVersion(sig.packages[0]),
                    confidence: Math.min(100, confidence),
                    indicators
                });
            }
        }
        return detected.sort((a, b) => b.confidence - a.confidence);
    }
    detectPrimaryLanguage() {
        if (this.allDeps.includes("typescript") || fs.existsSync(path.join(this.rootPath, "tsconfig.json"))) {
            return "TypeScript";
        }
        if (fs.existsSync(path.join(this.rootPath, "requirements.txt")) || fs.existsSync(path.join(this.rootPath, "pyproject.toml"))) {
            return "Python";
        }
        if (fs.existsSync(path.join(this.rootPath, "pom.xml")) || fs.existsSync(path.join(this.rootPath, "build.gradle"))) {
            return "Java";
        }
        if (fs.existsSync(path.join(this.rootPath, "go.mod"))) {
            return "Go";
        }
        if (fs.existsSync(path.join(this.rootPath, "Cargo.toml"))) {
            return "Rust";
        }
        if (this.packageJson) {
            return "JavaScript";
        }
        return "Unknown";
    }
    detectLanguages() {
        const extensions = {
            ".ts": "TypeScript", ".tsx": "TypeScript",
            ".js": "JavaScript", ".jsx": "JavaScript",
            ".py": "Python",
            ".java": "Java", ".kt": "Kotlin",
            ".go": "Go",
            ".rs": "Rust",
            ".rb": "Ruby",
            ".php": "PHP",
            ".cs": "C#",
            ".vue": "Vue",
            ".svelte": "Svelte"
        };
        const counts = {};
        let total = 0;
        this.walkFiles((filePath) => {
            const ext = path.extname(filePath);
            const lang = extensions[ext];
            if (lang) {
                counts[lang] = (counts[lang] || 0) + 1;
                total++;
            }
        }, 4);
        if (total === 0)
            return [];
        return Object.entries(counts)
            .map(([name, count]) => ({
            name,
            percentage: Math.round((count / total) * 100)
        }))
            .sort((a, b) => b.percentage - a.percentage);
    }
    analyzeArchitecture() {
        return {
            patterns: this.detectPatterns(),
            styling: this.detectStyling(),
            testing: this.detectTesting(),
            stateManagement: this.detectStateManagement(),
            routing: this.detectRouting(),
            api: this.detectAPIStyle(),
            build: this.detectBuildTools()
        };
    }
    detectPatterns() {
        const patterns = [];
        // Component-based
        if (this.hasFilesMatching(/\.(component|tsx|vue|svelte)\./)) {
            patterns.push("Component-Based Architecture");
        }
        // Service layer
        if (this.hasFilesMatching(/\.service\.(ts|js)$/)) {
            patterns.push("Service Layer Pattern");
        }
        // Module-based
        if (this.hasFilesMatching(/\.module\.(ts|js)$/)) {
            patterns.push("Feature Modules");
        }
        // Repository pattern
        if (this.hasDirectory("repositories") || this.hasFilesMatching(/\.repository\./)) {
            patterns.push("Repository Pattern");
        }
        // MVC
        if (this.hasDirectory("controllers") && this.hasDirectory("models")) {
            patterns.push("MVC Architecture");
        }
        // Reactive
        if (this.allDeps.includes("rxjs")) {
            patterns.push("Reactive Programming (RxJS)");
        }
        // GraphQL
        if (this.allDeps.some(d => d.includes("graphql") || d.includes("apollo"))) {
            patterns.push("GraphQL API");
        }
        // Monorepo
        if (fs.existsSync(path.join(this.rootPath, "nx.json")) ||
            fs.existsSync(path.join(this.rootPath, "turbo.json")) ||
            fs.existsSync(path.join(this.rootPath, "lerna.json"))) {
            patterns.push("Monorepo");
        }
        return patterns;
    }
    detectStyling() {
        const result = {};
        // Check preprocessors
        if (this.hasFilesMatching(/\.scss$/))
            result.preprocessor = "SCSS";
        else if (this.hasFilesMatching(/\.less$/))
            result.preprocessor = "LESS";
        else if (this.hasFilesMatching(/\.styl$/))
            result.preprocessor = "Stylus";
        // Check UI frameworks
        for (const [name, packages] of Object.entries(STYLING_LIBS)) {
            if (packages.length > 0 && packages.some(p => this.allDeps.includes(p))) {
                if (["SCSS", "LESS", "Stylus"].includes(name)) {
                    result.preprocessor = name;
                }
                else if (["TailwindCSS", "Bootstrap", "Material UI", "Angular Material", "Chakra UI", "Ant Design", "PrimeNG", "PrimeReact"].includes(name)) {
                    result.framework = name;
                }
                else {
                    result.methodology = name;
                }
            }
        }
        // CSS Modules detection
        if (this.hasFilesMatching(/\.module\.(css|scss)$/)) {
            result.methodology = "CSS Modules";
        }
        return result;
    }
    detectTesting() {
        const result = {};
        for (const [name, sig] of Object.entries(TEST_FRAMEWORKS)) {
            const hasPackage = sig.packages.some(p => this.allDeps.includes(p));
            const hasConfig = sig.configs.some(c => fs.existsSync(path.join(this.rootPath, c)));
            if (hasPackage || hasConfig) {
                if (["Cypress", "Playwright", "Puppeteer"].includes(name)) {
                    result.e2e = name;
                }
                else if (!result.framework) {
                    result.framework = name;
                }
            }
        }
        // Coverage tools
        if (this.allDeps.includes("nyc") || this.allDeps.includes("c8")) {
            result.coverage = "Istanbul/NYC";
        }
        return result;
    }
    detectStateManagement() {
        for (const [name, packages] of Object.entries(STATE_LIBRARIES)) {
            if (packages.some(p => this.allDeps.includes(p))) {
                const pattern = name.includes("Redux") || name.includes("NgRx") || name.includes("NGXS")
                    ? "Flux/Redux Pattern"
                    : name === "MobX" ? "Observable Pattern" : "Atomic State";
                return { library: name, pattern };
            }
        }
        return {};
    }
    detectRouting() {
        const routes = [];
        let type;
        if (this.allDeps.includes("@angular/router")) {
            type = "Angular Router";
        }
        else if (this.allDeps.includes("react-router-dom") || this.allDeps.includes("react-router")) {
            type = "React Router";
        }
        else if (this.allDeps.includes("vue-router")) {
            type = "Vue Router";
        }
        else if (this.allDeps.includes("next")) {
            type = "File-based Routing (Next.js)";
        }
        else if (this.allDeps.includes("nuxt")) {
            type = "File-based Routing (Nuxt)";
        }
        // Try to extract routes
        this.walkFiles((filePath) => {
            if (filePath.includes("route") || filePath.includes("routing")) {
                try {
                    const content = fs.readFileSync(filePath, "utf-8");
                    const matches = content.match(/path:\s*['"`]([^'"`]+)['"`]/g);
                    if (matches) {
                        matches.forEach(m => {
                            const pathMatch = m.match(/['"`]([^'"`]+)['"`]/);
                            if (pathMatch && routes.length < 10) {
                                routes.push(pathMatch[1]);
                            }
                        });
                    }
                }
                catch {
                    // Skip
                }
            }
        }, 4);
        return { type, routes };
    }
    detectAPIStyle() {
        let client;
        let style = "REST";
        if (this.allDeps.includes("axios"))
            client = "Axios";
        else if (this.allDeps.includes("@angular/common"))
            client = "Angular HttpClient";
        else if (this.allDeps.includes("@tanstack/react-query"))
            client = "TanStack Query";
        else if (this.allDeps.includes("swr"))
            client = "SWR";
        else if (this.allDeps.includes("got"))
            client = "Got";
        if (this.allDeps.some(d => d.includes("graphql") || d.includes("apollo"))) {
            style = "GraphQL";
        }
        else if (this.allDeps.some(d => d.includes("trpc"))) {
            style = "tRPC";
        }
        else if (this.allDeps.some(d => d.includes("grpc"))) {
            style = "gRPC";
        }
        return { client, style };
    }
    detectBuildTools() {
        const result = {};
        for (const [name, sig] of Object.entries(BUILD_TOOLS)) {
            const hasPackage = sig.packages.some(p => this.allDeps.includes(p));
            const hasConfig = sig.configs.some(c => fs.existsSync(path.join(this.rootPath, c)));
            if ((hasPackage || hasConfig) && !result.bundler) {
                result.bundler = name;
            }
        }
        // Transpiler
        if (this.allDeps.includes("typescript")) {
            result.transpiler = "TypeScript";
        }
        else if (this.allDeps.includes("@babel/core")) {
            result.transpiler = "Babel";
        }
        else if (this.allDeps.includes("@swc/core")) {
            result.transpiler = "SWC";
        }
        return result;
    }
    categorizeDependencies() {
        const production = [];
        const development = [];
        const byCategory = {};
        const categorize = (name) => {
            for (const [category, packages] of Object.entries(DEPENDENCY_CATEGORIES)) {
                if (packages.some(p => name.includes(p) || name === p)) {
                    return category;
                }
            }
            if (name.startsWith("@types/"))
                return "Type Definitions";
            if (name.includes("eslint") || name.includes("prettier"))
                return "Linting/Formatting";
            if (name.includes("test") || name.includes("spec"))
                return "Testing";
            return "Other";
        };
        if (this.packageJson) {
            for (const [name, version] of Object.entries(this.packageJson.dependencies || {})) {
                const category = categorize(name);
                const info = {
                    name,
                    version: String(version).replace(/[\^~]/, ""),
                    type: "production",
                    category
                };
                production.push(info);
                if (!byCategory[category])
                    byCategory[category] = [];
                byCategory[category].push(info);
            }
            for (const [name, version] of Object.entries(this.packageJson.devDependencies || {})) {
                const category = categorize(name);
                const info = {
                    name,
                    version: String(version).replace(/[\^~]/, ""),
                    type: "development",
                    category
                };
                development.push(info);
                if (!byCategory[category])
                    byCategory[category] = [];
                byCategory[category].push(info);
            }
        }
        return { production, development, byCategory };
    }
    detectProjectType() {
        const frameworks = this.detectFrameworks();
        const primary = frameworks[0]?.name;
        if (["Next.js", "Nuxt", "Remix", "Gatsby", "Astro"].includes(primary || "")) {
            return "Full-Stack Web Application";
        }
        if (["React", "Vue", "Angular", "Svelte", "Solid"].includes(primary || "")) {
            return "Single Page Application (SPA)";
        }
        if (["Express", "NestJS", "Fastify", "Koa", "Hono"].includes(primary || "")) {
            return "Backend API Server";
        }
        if (["Electron", "Tauri"].includes(primary || "")) {
            return "Desktop Application";
        }
        if (["React Native", "Expo"].includes(primary || "")) {
            return "Mobile Application";
        }
        if (this.packageJson?.main && !primary) {
            return "Node.js Library/Package";
        }
        return "Web Application";
    }
    // Utility methods
    getVersion(packageName) {
        return this.depVersions[packageName]?.replace(/[\^~]/, "");
    }
    hasDirectory(name) {
        const paths = [
            path.join(this.rootPath, name),
            path.join(this.rootPath, "src", name)
        ];
        return paths.some(p => {
            try {
                return fs.existsSync(p) && fs.statSync(p).isDirectory();
            }
            catch {
                return false;
            }
        });
    }
    hasFilesMatching(pattern) {
        let found = false;
        this.walkFiles((filePath) => {
            if (!found && pattern.test(filePath)) {
                found = true;
            }
        }, 3);
        return found;
    }
    walkFiles(callback, maxDepth = 4, dir, depth = 0) {
        if (depth >= maxDepth)
            return;
        const currentDir = dir || this.rootPath;
        try {
            const entries = fs.readdirSync(currentDir);
            for (const entry of entries) {
                if (entry.startsWith(".") || ["node_modules", "dist", "build", "coverage", ".git"].includes(entry)) {
                    continue;
                }
                const fullPath = path.join(currentDir, entry);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        this.walkFiles(callback, maxDepth, fullPath, depth + 1);
                    }
                    else {
                        callback(fullPath);
                    }
                }
                catch {
                    // Skip
                }
            }
        }
        catch {
            // Skip
        }
    }
}
exports.EnhancedTechStackDetector = EnhancedTechStackDetector;
//# sourceMappingURL=enhancedTechStackDetector.js.map