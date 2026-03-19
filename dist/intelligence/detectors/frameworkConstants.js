"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPENDENCY_CATEGORIES = exports.TEST_FRAMEWORKS = exports.BUILD_TOOLS = exports.STYLING_LIBS = exports.STATE_LIBRARIES = exports.FRAMEWORK_SIGNATURES = void 0;
/**
 * Framework signatures for detection
 */
exports.FRAMEWORK_SIGNATURES = {
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
/**
 * State management libraries
 */
exports.STATE_LIBRARIES = {
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
/**
 * Styling libraries and preprocessors
 */
exports.STYLING_LIBS = {
    TailwindCSS: ["tailwindcss"],
    Bootstrap: ["bootstrap"],
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
    PrimeNG: ["primeng"],
    PrimeReact: ["primereact"],
    Radix: ["@radix-ui/react-dialog"],
    "Shadcn/ui": ["@radix-ui/react-slot"]
};
/**
 * Build tools
 */
exports.BUILD_TOOLS = {
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
/**
 * Testing frameworks for JavaScript/TypeScript
 */
exports.TEST_FRAMEWORKS = {
    Jest: { packages: ["jest"], configs: ["jest.config.js", "jest.config.ts"] },
    Vitest: { packages: ["vitest"], configs: ["vitest.config.ts"] },
    Karma: { packages: ["karma"], configs: ["karma.conf.js"] },
    Mocha: { packages: ["mocha"], configs: [".mocharc.js"] },
    Jasmine: { packages: ["jasmine"], configs: ["jasmine.json"] },
    AVA: { packages: ["ava"], configs: [] },
    Cypress: { packages: ["cypress"], configs: ["cypress.config.js", "cypress.config.ts"] },
    Playwright: { packages: ["@playwright/test"], configs: ["playwright.config.ts"] },
    Puppeteer: { packages: ["puppeteer"], configs: [] },
    "Testing Library": {
        packages: ["@testing-library/react", "@testing-library/angular"],
        configs: []
    }
};
/**
 * Dependency categorization
 */
exports.DEPENDENCY_CATEGORIES = {
    "Core Framework": ["react", "vue", "@angular/core", "svelte", "next", "nuxt"],
    "State Management": [
        "redux",
        "@ngrx/store",
        "mobx",
        "zustand",
        "vuex",
        "pinia",
        "recoil",
        "jotai"
    ],
    Routing: ["react-router", "@angular/router", "vue-router"],
    "HTTP/API": [
        "axios",
        "node-fetch",
        "got",
        "ky",
        "@tanstack/react-query",
        "swr",
        "apollo-client"
    ],
    Forms: [
        "formik",
        "react-hook-form",
        "@angular/forms",
        "vee-validate",
        "yup",
        "zod"
    ],
    "UI Components": [
        "@mui/material",
        "@angular/material",
        "antd",
        "@chakra-ui/react",
        "primeng"
    ],
    Styling: ["tailwindcss", "styled-components", "@emotion/react", "sass"],
    Animation: ["framer-motion", "gsap", "@angular/animations", "animejs", "lottie-web"],
    "Charts/Visualization": [
        "chart.js",
        "d3",
        "recharts",
        "highcharts",
        "echarts",
        "plotly.js"
    ],
    "Date/Time": ["moment", "dayjs", "date-fns", "luxon"],
    Utilities: ["lodash", "ramda", "rxjs", "immer"],
    Testing: [
        "jest",
        "vitest",
        "mocha",
        "cypress",
        "playwright",
        "@testing-library/react"
    ],
    "Build Tools": ["webpack", "vite", "rollup", "esbuild", "turbo"],
    "Linting/Formatting": ["eslint", "prettier", "stylelint"],
    "Type Safety": ["typescript", "zod", "io-ts", "class-validator"]
};
//# sourceMappingURL=frameworkConstants.js.map