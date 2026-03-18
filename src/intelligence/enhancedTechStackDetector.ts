import * as fs from "fs";
import * as path from "path";

export interface FrameworkInfo {
  name: string;
  version?: string;
  confidence: number;
  indicators: string[];
}

export interface ArchitectureInfo {
  patterns: string[];
  styling: { preprocessor?: string; framework?: string; methodology?: string };
  testing: { framework?: string; e2e?: string; coverage?: string };
  stateManagement: { library?: string; pattern?: string };
  routing: { type?: string; routes: string[] };
  api: { client?: string; style?: string };
  build: { bundler?: string; transpiler?: string; buildSystem?: string };
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: "production" | "development";
  category: string;
}

export interface TechStackResult {
  frameworks: FrameworkInfo[];
  primaryLanguage: string;
  languages: { name: string; percentage: number }[];
  architecture: ArchitectureInfo;
  dependencies: {
    production: DependencyInfo[];
    development: DependencyInfo[];
    byCategory: Record<string, DependencyInfo[]>;
  };
  projectType: string;
}

// ============================================
// COMPREHENSIVE FILE EXTENSION TO LANGUAGE MAP
// ============================================
const FILE_EXTENSION_LANGUAGES: Record<string, string> = {
  // C/C++
  ".c": "C", ".h": "C/C++ Header",
  ".cpp": "C++", ".cc": "C++", ".cxx": "C++", ".c++": "C++",
  ".hpp": "C++ Header", ".hh": "C++ Header", ".hxx": "C++ Header", ".h++": "C++ Header",
  ".ipp": "C++ Implementation",
  
  // JavaScript/TypeScript
  ".js": "JavaScript", ".jsx": "JavaScript (JSX)", ".mjs": "JavaScript (ES Module)",
  ".ts": "TypeScript", ".tsx": "TypeScript (TSX)", ".mts": "TypeScript (ES Module)",
  ".d.ts": "TypeScript Declarations",
  
  // Python
  ".py": "Python", ".pyw": "Python", ".pyi": "Python (Stub)",
  ".pyx": "Cython", ".pxd": "Cython Declaration",
  
  // Java/JVM
  ".java": "Java",
  ".kt": "Kotlin", ".kts": "Kotlin Script",
  ".scala": "Scala",
  ".groovy": "Groovy",
  ".clj": "Clojure",
  
  // C#/.NET
  ".cs": "C#",
  ".vb": "Visual Basic",
  ".fs": "F#", ".fsx": "F# Script",
  
  // System/Low-level
  ".rs": "Rust",
  ".go": "Go",
  ".zig": "Zig",
  ".nim": "Nim",
  ".d": "D",
  ".asm": "Assembly", ".s": "Assembly",
  
  // Web/Markup
  ".html": "HTML", ".htm": "HTML",
  ".css": "CSS", ".scss": "SCSS", ".sass": "Sass", ".less": "Less",
  ".vue": "Vue", ".svelte": "Svelte",
  ".astro": "Astro",
  
  // Shell/Scripts
  ".sh": "Shell (Bash)", ".bash": "Bash",
  ".zsh": "Zsh",
  ".fish": "Fish",
  ".ps1": "PowerShell", ".psm1": "PowerShell Module",
  ".bat": "Batch", ".cmd": "Batch",
  
  // Configuration/Data
  ".json": "JSON", ".json5": "JSON5",
  ".yaml": "YAML", ".yml": "YAML",
  ".xml": "XML", ".xsd": "XML Schema", ".xsl": "XSLT",
  ".toml": "TOML",
  ".ini": "INI",
  ".env": "Environment Config",
  ".properties": "Properties",
  
  // Database
  ".sql": "SQL",
  ".plsql": "PL/SQL", ".pls": "PL/SQL",
  ".prisma": "Prisma Schema",
  
  // Protocol/Serialization
  ".proto": "Protocol Buffers",
  ".thrift": "Thrift",
  ".avsc": "Avro Schema",
  ".fbs": "FlatBuffers",
  
  // Testing
  ".robot": "Robot Framework",
  ".feature": "Gherkin/Cucumber",
  ".spec.ts": "TypeScript Test", ".spec.js": "JavaScript Test",
  ".test.ts": "TypeScript Test", ".test.js": "JavaScript Test",
  
  // Documentation
  ".md": "Markdown", ".mdx": "MDX",
  ".rst": "reStructuredText",
  ".adoc": "AsciiDoc",
  ".tex": "LaTeX",
  
  // Ruby
  ".rb": "Ruby", ".erb": "ERB Template",
  ".rake": "Rake",
  ".gemspec": "Gem Spec",
  
  // PHP
  ".php": "PHP", ".phtml": "PHP Template",
  ".blade.php": "Blade Template",
  
  // Swift/Objective-C
  ".swift": "Swift",
  ".m": "Objective-C", ".mm": "Objective-C++",
  
  // Other
  ".lua": "Lua",
  ".r": "R", ".R": "R",
  ".pl": "Perl", ".pm": "Perl Module",
  ".ex": "Elixir", ".exs": "Elixir Script",
  ".erl": "Erlang", ".hrl": "Erlang Header",
  ".dart": "Dart",
  ".jl": "Julia",
  ".ml": "OCaml", ".mli": "OCaml Interface",
  ".hs": "Haskell", ".lhs": "Literate Haskell",
  ".elm": "Elm",
  ".v": "Verilog", ".sv": "SystemVerilog",
  ".vhdl": "VHDL", ".vhd": "VHDL",
  ".sol": "Solidity",
  ".move": "Move",
  ".wasm": "WebAssembly", ".wat": "WebAssembly Text"
};

// ============================================
// BUILD SYSTEM DETECTION
// ============================================
const BUILD_SYSTEM_SIGNATURES: Record<string, {
  files: string[];
  indicators: string[];
  language?: string;
}> = {
  // C/C++ Build Systems
  "CMake": {
    files: ["CMakeLists.txt", "cmake/**/*.cmake"],
    indicators: ["cmake", "cmake_minimum_required", "find_package"],
    language: "C/C++"
  },
  "Make": {
    files: ["Makefile", "GNUmakefile", "makefile", "*.mk"],
    indicators: ["make", "gcc", "g++", "clang"],
    language: "C/C++"
  },
  "Meson": {
    files: ["meson.build", "meson_options.txt"],
    indicators: ["meson"],
    language: "C/C++"
  },
  "Bazel": {
    files: ["BUILD", "BUILD.bazel", "WORKSPACE", "WORKSPACE.bazel"],
    indicators: ["bazel", "blaze"],
  },
  "Ninja": {
    files: ["build.ninja"],
    indicators: ["ninja"]
  },
  "Autotools": {
    files: ["configure.ac", "Makefile.am", "configure"],
    indicators: ["autoconf", "automake"],
    language: "C/C++"
  },
  "SCons": {
    files: ["SConstruct", "SConscript"],
    indicators: ["scons"],
    language: "C/C++"
  },
  "Premake": {
    files: ["premake5.lua", "premake4.lua"],
    indicators: ["premake"],
    language: "C/C++"
  },
  "QMake": {
    files: ["*.pro", "*.pri"],
    indicators: ["qmake", "Qt"],
    language: "C++"
  },
  "Conan": {
    files: ["conanfile.py", "conanfile.txt"],
    indicators: ["conan"],
    language: "C/C++"
  },
  "vcpkg": {
    files: ["vcpkg.json"],
    indicators: ["vcpkg"],
    language: "C/C++"
  },
  
  // Java/JVM Build Systems
  "Maven": {
    files: ["pom.xml"],
    indicators: ["maven", "mvn"],
    language: "Java"
  },
  "Gradle": {
    files: ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"],
    indicators: ["gradle"],
    language: "Java/Kotlin"
  },
  "Ant": {
    files: ["build.xml"],
    indicators: ["ant"],
    language: "Java"
  },
  "sbt": {
    files: ["build.sbt", "project/build.properties"],
    indicators: ["sbt"],
    language: "Scala"
  },
  
  // Python Build Systems
  "pip": {
    files: ["requirements.txt", "requirements-dev.txt"],
    indicators: ["pip"],
    language: "Python"
  },
  "Poetry": {
    files: ["pyproject.toml", "poetry.lock"],
    indicators: ["poetry"],
    language: "Python"
  },
  "setuptools": {
    files: ["setup.py", "setup.cfg"],
    indicators: ["setuptools"],
    language: "Python"
  },
  "Pipenv": {
    files: ["Pipfile", "Pipfile.lock"],
    indicators: ["pipenv"],
    language: "Python"
  },
  "Conda": {
    files: ["environment.yml", "conda.yaml"],
    indicators: ["conda"],
    language: "Python"
  },
  
  // Rust
  "Cargo": {
    files: ["Cargo.toml", "Cargo.lock"],
    indicators: ["cargo"],
    language: "Rust"
  },
  
  // Go
  "Go Modules": {
    files: ["go.mod", "go.sum"],
    indicators: ["go"],
    language: "Go"
  },
  
  // .NET
  "MSBuild": {
    files: ["*.csproj", "*.vbproj", "*.fsproj", "*.sln"],
    indicators: ["msbuild", "dotnet"],
    language: "C#"
  },
  "NuGet": {
    files: ["packages.config", "*.nuspec"],
    indicators: ["nuget"],
    language: "C#"
  },
  
  // Ruby
  "Bundler": {
    files: ["Gemfile", "Gemfile.lock"],
    indicators: ["bundler", "gem"],
    language: "Ruby"
  },
  "Rake": {
    files: ["Rakefile"],
    indicators: ["rake"],
    language: "Ruby"
  },
  
  // PHP
  "Composer": {
    files: ["composer.json", "composer.lock"],
    indicators: ["composer"],
    language: "PHP"
  },
  
  // JavaScript/TypeScript
  "npm": {
    files: ["package.json", "package-lock.json"],
    indicators: ["npm"],
    language: "JavaScript/TypeScript"
  },
  "Yarn": {
    files: ["yarn.lock", ".yarnrc.yml"],
    indicators: ["yarn"],
    language: "JavaScript/TypeScript"
  },
  "pnpm": {
    files: ["pnpm-lock.yaml", "pnpm-workspace.yaml"],
    indicators: ["pnpm"],
    language: "JavaScript/TypeScript"
  },
  "Bun": {
    files: ["bun.lockb"],
    indicators: ["bun"],
    language: "JavaScript/TypeScript"
  },
  
  // Enterprise/Custom
  "BMS": {
    files: [".bms/**", "bms.xml", "bms.yaml"],
    indicators: ["bms", "build management"],
  },
  "CMK": {
    files: [".cmk/**", "cmk/**", "*.cmk"],
    indicators: ["cmk", "deployment"],
  },
  
  // Mobile
  "CocoaPods": {
    files: ["Podfile", "Podfile.lock"],
    indicators: ["cocoapods", "pod"],
    language: "Swift/Objective-C"
  },
  "Swift Package Manager": {
    files: ["Package.swift"],
    indicators: ["swift"],
    language: "Swift"
  }
};

// ============================================
// TESTING FRAMEWORK DETECTION (Language-agnostic)
// ============================================
const TESTING_FRAMEWORKS: Record<string, {
  files: string[];
  patterns: RegExp[];
  language?: string;
}> = {
  // Robot Framework
  "Robot Framework": {
    files: ["*.robot", "robot.yaml", "robot.yml"],
    patterns: [/\.robot$/, /profiles_regression/, /robot\.yaml/],
    language: "Python"
  },
  
  // Python
  "pytest": {
    files: ["pytest.ini", "pyproject.toml", "conftest.py"],
    patterns: [/test_.*\.py$/, /.*_test\.py$/],
    language: "Python"
  },
  "unittest": {
    files: [],
    patterns: [/test_.*\.py$/, /import unittest/],
    language: "Python"
  },
  "nose": {
    files: ["nose.cfg", ".noserc"],
    patterns: [/test_.*\.py$/],
    language: "Python"
  },
  
  // C/C++
  "Google Test": {
    files: ["googletest/**", "gtest/**"],
    patterns: [/gtest|googletest/, /TEST\(|TEST_F\(/],
    language: "C++"
  },
  "Catch2": {
    files: ["catch.hpp", "catch2/**"],
    patterns: [/catch\.hpp/, /CATCH_|TEST_CASE/],
    language: "C++"
  },
  "CppUnit": {
    files: [],
    patterns: [/cppunit/, /CPPUNIT_TEST/],
    language: "C++"
  },
  "Boost.Test": {
    files: [],
    patterns: [/boost\/test/, /BOOST_AUTO_TEST/],
    language: "C++"
  },
  "CUnit": {
    files: [],
    patterns: [/CUnit/, /CU_ASSERT/],
    language: "C"
  },
  
  // Java
  "JUnit": {
    files: [],
    patterns: [/@Test/, /junit/, /\.java$/],
    language: "Java"
  },
  "TestNG": {
    files: ["testng.xml"],
    patterns: [/testng/, /@Test/],
    language: "Java"
  },
  "Mockito": {
    files: [],
    patterns: [/mockito/, /@Mock/],
    language: "Java"
  },
  
  // JavaScript/TypeScript
  "Jest": {
    files: ["jest.config.js", "jest.config.ts", "jest.config.json"],
    patterns: [/\.test\.(ts|js|tsx|jsx)$/, /\.spec\.(ts|js|tsx|jsx)$/],
    language: "JavaScript/TypeScript"
  },
  "Vitest": {
    files: ["vitest.config.ts", "vitest.config.js"],
    patterns: [/\.test\.(ts|js)$/, /vitest/],
    language: "JavaScript/TypeScript"
  },
  "Mocha": {
    files: [".mocharc.js", ".mocharc.json", "mocha.opts"],
    patterns: [/describe\(|it\(/],
    language: "JavaScript/TypeScript"
  },
  "Karma": {
    files: ["karma.conf.js"],
    patterns: [/karma/],
    language: "JavaScript/TypeScript"
  },
  "Jasmine": {
    files: ["jasmine.json"],
    patterns: [/jasmine/, /describe\(|it\(/],
    language: "JavaScript/TypeScript"
  },
  "Cypress": {
    files: ["cypress.config.js", "cypress.config.ts", "cypress/**"],
    patterns: [/cypress/, /cy\./],
    language: "JavaScript/TypeScript"
  },
  "Playwright": {
    files: ["playwright.config.ts", "playwright.config.js"],
    patterns: [/playwright/, /test\(/],
    language: "JavaScript/TypeScript"
  },
  
  // Cucumber/BDD
  "Cucumber": {
    files: ["cucumber.js", "*.feature"],
    patterns: [/\.feature$/, /Given|When|Then/],
  },
  "Behave": {
    files: ["behave.ini", "features/**/*.feature"],
    patterns: [/\.feature$/, /behave/],
    language: "Python"
  },
  
  // Go
  "Go Testing": {
    files: ["*_test.go"],
    patterns: [/_test\.go$/, /testing\.T/],
    language: "Go"
  },
  
  // Rust
  "Rust Testing": {
    files: [],
    patterns: [/#\[test\]/, /cargo test/],
    language: "Rust"
  },
  
  // .NET
  "xUnit": {
    files: [],
    patterns: [/xunit/, /\[Fact\]|\[Theory\]/],
    language: "C#"
  },
  "NUnit": {
    files: [],
    patterns: [/nunit/, /\[Test\]|\[TestCase\]/],
    language: "C#"
  },
  "MSTest": {
    files: [],
    patterns: [/mstest/, /\[TestMethod\]/],
    language: "C#"
  }
};

// ============================================
// PROJECT PATTERN DETECTION FROM FOLDERS
// ============================================
const FOLDER_PATTERNS: Record<string, {
  folders: string[];
  pattern: string;
}> = {
  "Microservices": {
    folders: ["services/**", "microservices/**", "apps/**"],
    pattern: "Microservices Architecture"
  },
  "MVC": {
    folders: ["controllers", "models", "views"],
    pattern: "MVC Architecture"
  },
  "Clean Architecture": {
    folders: ["domain", "application", "infrastructure", "presentation"],
    pattern: "Clean Architecture"
  },
  "Hexagonal": {
    folders: ["adapters", "ports", "core"],
    pattern: "Hexagonal Architecture"
  },
  "DDD": {
    folders: ["domain", "aggregates", "entities", "repositories", "value-objects"],
    pattern: "Domain-Driven Design"
  },
  "Layered": {
    folders: ["dal", "bll", "ui", "dba", "svc"],
    pattern: "Layered Architecture"
  },
  "Feature-based": {
    folders: ["features/**", "modules/**"],
    pattern: "Feature-based Architecture"
  },
  "Component-based": {
    folders: ["components/**", "widgets/**"],
    pattern: "Component-based Architecture"
  },
  "API Layer": {
    folders: ["api", "json_api", "rest", "graphql"],
    pattern: "API Layer Pattern"
  },
  "BOM Pattern": {
    folders: ["bom", "bom2", "bommanager"],
    pattern: "Business Object Model"
  },
  "Database Layer": {
    folders: ["dba", "DBLayer", "database", "db"],
    pattern: "Database Layer Pattern"
  },
  "Service Layer": {
    folders: ["svc", "services", "service"],
    pattern: "Service Layer Pattern"
  },
  "Factory Pattern": {
    folders: ["factory", "factory2", "factories"],
    pattern: "Factory Pattern"
  },
  "Adapter Pattern": {
    folders: ["adapter", "adapters", "adaptor", "adaptors"],
    pattern: "Adapter Pattern"
  },
  "Test Suite": {
    folders: ["test", "tests", "spec", "specs", "__tests__", "regression_tests", "profiles_regression"],
    pattern: "Test Infrastructure"
  }
};

// Framework signatures for detection
const FRAMEWORK_SIGNATURES: Record<string, {
  packages: string[];
  files: string[];
  codePatterns?: RegExp[];
}> = {
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
const STATE_LIBRARIES: Record<string, string[]> = {
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
const TEST_FRAMEWORKS: Record<string, { packages: string[]; configs: string[] }> = {
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
const STYLING_LIBS: Record<string, string[]> = {
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
const BUILD_TOOLS: Record<string, { packages: string[]; configs: string[] }> = {
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
const DEPENDENCY_CATEGORIES: Record<string, string[]> = {
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

export class EnhancedTechStackDetector {
  private rootPath: string;
  private packageJson: any = null;
  private allDeps: string[] = [];
  private depVersions: Record<string, string> = {};
  private fileExtensionCounts: Record<string, number> = {};
  private totalFiles: number = 0;
  private detectedBuildSystems: string[] = [];
  private detectedTestFrameworks: string[] = [];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.loadPackageJson();
    this.scanFileExtensions();
  }

  private loadPackageJson(): void {
    const pkgPath = path.join(this.rootPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        this.packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        
        const deps = this.packageJson.dependencies || {};
        const devDeps = this.packageJson.devDependencies || {};
        const peerDeps = this.packageJson.peerDependencies || {};
        
        this.depVersions = { ...deps, ...devDeps, ...peerDeps };
        this.allDeps = Object.keys(this.depVersions);
      } catch {
        this.packageJson = null;
      }
    }
  }

  /**
   * Scan all file extensions to detect languages (works without package.json)
   */
  private scanFileExtensions(): void {
    this.walkFiles((filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext) {
        this.fileExtensionCounts[ext] = (this.fileExtensionCounts[ext] || 0) + 1;
        this.totalFiles++;
      }
    }, 6); // Increased depth for comprehensive scanning
  }

  analyze(): TechStackResult {
    return {
      frameworks: this.detectFrameworks(),
      primaryLanguage: this.detectPrimaryLanguage(),
      languages: this.detectLanguages(),
      architecture: this.analyzeArchitecture(),
      dependencies: this.categorizeDependencies(),
      projectType: this.detectProjectType()
    };
  }

  private detectFrameworks(): FrameworkInfo[] {
    const detected: FrameworkInfo[] = [];

    // JavaScript/TypeScript frameworks (from package.json)
    for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
      let confidence = 0;
      const indicators: string[] = [];

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

    // C++ frameworks detection (from file patterns)
    if (this.hasLanguageFiles([".cpp", ".cc", ".cxx", ".hpp", ".h"])) {
      // Qt Detection
      if (this.hasFilesMatching(/\.pro$/) || this.hasFilesMatching(/\.pri$/) || 
          this.hasCodePattern(/Q_OBJECT|QWidget|QMainWindow|#include\s*<Q/)) {
        detected.push({
          name: "Qt",
          confidence: 85,
          indicators: ["Qt project files (.pro/.pri)", "Qt includes or macros"]
        });
      }
      
      // Boost Detection
      if (this.hasCodePattern(/boost::|#include\s*<boost\//)) {
        detected.push({
          name: "Boost",
          confidence: 80,
          indicators: ["Boost includes"]
        });
      }

      // STL/Standard C++
      if (this.hasCodePattern(/#include\s*<(vector|map|string|memory|algorithm|iostream)/)) {
        detected.push({
          name: "C++ STL",
          confidence: 90,
          indicators: ["STL headers"]
        });
      }
    }

    // Python frameworks detection
    if (this.hasLanguageFiles([".py"])) {
      // Django
      if (fs.existsSync(path.join(this.rootPath, "manage.py")) ||
          this.hasCodePattern(/from django|import django/)) {
        detected.push({
          name: "Django",
          confidence: 90,
          indicators: ["manage.py or django imports"]
        });
      }
      
      // Flask
      if (this.hasCodePattern(/from flask|import flask|Flask\(__name__\)/)) {
        detected.push({
          name: "Flask",
          confidence: 85,
          indicators: ["Flask imports"]
        });
      }

      // FastAPI
      if (this.hasCodePattern(/from fastapi|import fastapi|FastAPI\(\)/)) {
        detected.push({
          name: "FastAPI",
          confidence: 85,
          indicators: ["FastAPI imports"]
        });
      }
    }

    // Robot Framework detection
    if (this.hasFilesMatching(/\.robot$/)) {
      detected.push({
        name: "Robot Framework",
        confidence: 95,
        indicators: [".robot test files"]
      });
    }

    // Protocol Buffers detection
    if (this.hasFilesMatching(/\.proto$/)) {
      detected.push({
        name: "Protocol Buffers",
        confidence: 90,
        indicators: [".proto files"]
      });
    }

    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  private detectPrimaryLanguage(): string {
    // Build system-based detection (highest priority)
    const buildSystems = this.detectBuildSystemsFromFiles();
    
    for (const system of buildSystems) {
      const sig = BUILD_SYSTEM_SIGNATURES[system];
      if (sig?.language) {
        return sig.language;
      }
    }

    // File extension-based detection
    const languageCounts: Record<string, number> = {};
    
    for (const [ext, count] of Object.entries(this.fileExtensionCounts)) {
      const lang = FILE_EXTENSION_LANGUAGES[ext];
      if (lang && !lang.includes("Header") && !lang.includes("Config")) {
        // Group related languages
        let normalizedLang = lang;
        if (lang.includes("JavaScript")) normalizedLang = "JavaScript";
        if (lang.includes("TypeScript")) normalizedLang = "TypeScript";
        
        languageCounts[normalizedLang] = (languageCounts[normalizedLang] || 0) + count;
      }
    }

    // Find the dominant language
    let maxCount = 0;
    let primaryLang = "Unknown";
    
    for (const [lang, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryLang = lang;
      }
    }

    // TypeScript overrides JavaScript
    if (primaryLang === "JavaScript" && this.fileExtensionCounts[".ts"]) {
      if (this.fileExtensionCounts[".ts"] > (this.fileExtensionCounts[".js"] || 0) / 2) {
        return "TypeScript";
      }
    }

    return primaryLang;
  }

  private detectLanguages(): { name: string; percentage: number }[] {
    const languageCounts: Record<string, number> = {};
    let total = 0;

    for (const [ext, count] of Object.entries(this.fileExtensionCounts)) {
      const lang = FILE_EXTENSION_LANGUAGES[ext];
      if (lang) {
        // Normalize language names
        let normalizedLang = lang;
        if (lang.includes("JavaScript")) normalizedLang = "JavaScript";
        if (lang.includes("TypeScript")) normalizedLang = "TypeScript";
        if (lang === "C/C++ Header") continue; // Don't count headers separately
        
        languageCounts[normalizedLang] = (languageCounts[normalizedLang] || 0) + count;
        total += count;
      }
    }

    if (total === 0) return [];

    return Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100)
      }))
      .filter(l => l.percentage >= 1) // Only show languages with at least 1%
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 languages
  }

  private analyzeArchitecture(): ArchitectureInfo {
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

  private detectPatterns(): string[] {
    const patterns: string[] = [];

    // Detect from folder structure
    for (const [, config] of Object.entries(FOLDER_PATTERNS)) {
      for (const folder of config.folders) {
        const cleanFolder = folder.replace(/\*\*/g, "").replace(/\//g, "");
        if (this.hasDirectory(cleanFolder)) {
          if (!patterns.includes(config.pattern)) {
            patterns.push(config.pattern);
          }
          break;
        }
      }
    }

    // Component-based
    if (this.hasFilesMatching(/\.(component|tsx|vue|svelte)\./)) {
      if (!patterns.includes("Component-Based Architecture")) {
        patterns.push("Component-Based Architecture");
      }
    }

    // Service layer for TS/JS
    if (this.hasFilesMatching(/\.service\.(ts|js)$/)) {
      if (!patterns.includes("Service Layer Pattern")) {
        patterns.push("Service Layer Pattern");
      }
    }

    // Module-based
    if (this.hasFilesMatching(/\.module\.(ts|js)$/)) {
      patterns.push("Feature Modules");
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

    // Enterprise patterns from folder structure
    if (this.hasDirectory("cmk") || this.hasDirectory(".cmk")) {
      patterns.push("CMK Deployment");
    }
    if (this.hasDirectory(".bms")) {
      patterns.push("BMS Build System");
    }
    if (this.hasDirectory(".devcontainer")) {
      patterns.push("Dev Container Support");
    }
    if (this.hasDirectory(".github")) {
      patterns.push("GitHub Workflows");
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  private detectBuildSystemsFromFiles(): string[] {
    const detected: string[] = [];

    for (const [name, sig] of Object.entries(BUILD_SYSTEM_SIGNATURES)) {
      for (const filePattern of sig.files) {
        // Handle glob patterns
        const cleanPattern = filePattern.replace(/\*\*/g, "").replace(/\*/g, "");
        
        if (cleanPattern.includes("/")) {
          // Directory pattern
          const dir = cleanPattern.split("/")[0];
          if (this.hasDirectory(dir)) {
            detected.push(name);
            break;
          }
        } else if (cleanPattern.startsWith(".")) {
          // Extension pattern
          const ext = cleanPattern;
          if (this.hasFilesMatching(new RegExp(`\\${ext}$`))) {
            detected.push(name);
            break;
          }
        } else {
          // Exact file
          if (fs.existsSync(path.join(this.rootPath, filePattern))) {
            detected.push(name);
            break;
          }
        }
      }
    }

    this.detectedBuildSystems = detected;
    return detected;
  }

  private detectTesting(): { framework?: string; e2e?: string; coverage?: string } {
    const result: { framework?: string; e2e?: string; coverage?: string } = {};
    const detected: string[] = [];

    // Check for test frameworks from files and patterns
    for (const [name, config] of Object.entries(TESTING_FRAMEWORKS)) {
      // Check files
      for (const filePattern of config.files) {
        if (filePattern.includes("*")) {
          const ext = filePattern.replace("*", "");
          if (this.hasFilesMatching(new RegExp(`\\${ext}$`))) {
            detected.push(name);
            break;
          }
        } else if (fs.existsSync(path.join(this.rootPath, filePattern))) {
          detected.push(name);
          break;
        }
      }

      // Check patterns
      for (const pattern of config.patterns) {
        if (this.hasFilesMatching(pattern)) {
          if (!detected.includes(name)) {
            detected.push(name);
          }
          break;
        }
      }
    }

    // Also check package.json for JS test frameworks
    for (const [name, sig] of Object.entries(TEST_FRAMEWORKS)) {
      const hasPackage = sig.packages.some(p => this.allDeps.includes(p));
      const hasConfig = sig.configs.some(c => fs.existsSync(path.join(this.rootPath, c)));

      if (hasPackage || hasConfig) {
        if (!detected.includes(name)) {
          detected.push(name);
        }
      }
    }

    // Categorize
    for (const name of detected) {
      if (["Cypress", "Playwright", "Puppeteer"].includes(name)) {
        result.e2e = result.e2e || name;
      } else if (!result.framework) {
        result.framework = name;
      }
    }

    this.detectedTestFrameworks = detected;

    // Coverage tools
    if (this.allDeps.includes("nyc") || this.allDeps.includes("c8")) {
      result.coverage = "Istanbul/NYC";
    }
    if (detected.includes("pytest")) {
      result.coverage = "pytest-cov";
    }

    return result;
  }

  private detectBuildTools(): { bundler?: string; transpiler?: string; buildSystem?: string } {
    const result: { bundler?: string; transpiler?: string; buildSystem?: string } = {};

    // Detect build systems
    const buildSystems = this.detectBuildSystemsFromFiles();
    if (buildSystems.length > 0) {
      result.buildSystem = buildSystems.join(", ");
    }

    // JS/TS bundlers
    for (const [name, sig] of Object.entries(BUILD_TOOLS)) {
      const hasPackage = sig.packages.some(p => this.allDeps.includes(p));
      const hasConfig = sig.configs.some(c => fs.existsSync(path.join(this.rootPath, c)));

      if ((hasPackage || hasConfig) && !result.bundler) {
        result.bundler = name;
      }
    }

    // Transpiler
    if (this.allDeps.includes("typescript") || fs.existsSync(path.join(this.rootPath, "tsconfig.json"))) {
      result.transpiler = "TypeScript";
    } else if (this.allDeps.includes("@babel/core")) {
      result.transpiler = "Babel";
    } else if (this.allDeps.includes("@swc/core")) {
      result.transpiler = "SWC";
    }

    return result;
  }

  private detectProjectType(): string {
    const frameworks = this.detectFrameworks();
    const primary = frameworks[0]?.name;
    const primaryLang = this.detectPrimaryLanguage();
    const buildSystems = this.detectedBuildSystems;

    // C/C++ project types
    if (primaryLang === "C++" || primaryLang === "C") {
      if (buildSystems.includes("CMake") || buildSystems.includes("Make")) {
        if (this.hasDirectory("test") || this.hasDirectory("tests")) {
          return "C/C++ Application with Tests";
        }
        return "C/C++ Application";
      }
      if (buildSystems.includes("BMS") || buildSystems.includes("CMK")) {
        return "Enterprise C/C++ System";
      }
      return "C/C++ Project";
    }

    // Python project types
    if (primaryLang === "Python") {
      if (this.detectedTestFrameworks.includes("Robot Framework")) {
        return "Python Application with Robot Framework Tests";
      }
      if (frameworks.some(f => f.name === "Django")) {
        return "Django Web Application";
      }
      if (frameworks.some(f => f.name === "Flask" || f.name === "FastAPI")) {
        return "Python API Server";
      }
      return "Python Application";
    }

    // Java project types
    if (primaryLang === "Java" || primaryLang === "Java/Kotlin") {
      if (buildSystems.includes("Maven") || buildSystems.includes("Gradle")) {
        return "Java/JVM Application";
      }
      return "Java Project";
    }

    // JavaScript/TypeScript frameworks
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

    // Mixed/Enterprise
    if (buildSystems.length > 1) {
      return "Multi-Technology Enterprise System";
    }

    if (this.packageJson?.main && !primary) {
      return "Node.js Library/Package";
    }

    return `${primaryLang} Application`;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private hasLanguageFiles(extensions: string[]): boolean {
    for (const ext of extensions) {
      if ((this.fileExtensionCounts[ext] || 0) > 0) {
        return true;
      }
    }
    return false;
  }

  private hasCodePattern(pattern: RegExp): boolean {
    let found = false;
    this.walkFiles((filePath) => {
      if (found) return;
      const ext = path.extname(filePath).toLowerCase();
      // Only check source files
      if ([".cpp", ".cc", ".c", ".h", ".hpp", ".py", ".java", ".ts", ".js"].includes(ext)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8").substring(0, 10000); // First 10KB
          if (pattern.test(content)) {
            found = true;
          }
        } catch {
          // Skip unreadable files
        }
      }
    }, 3);
    return found;
  }

  private getVersion(packageName: string): string | undefined {
    return this.depVersions[packageName]?.replace(/[\^~]/, "");
  }

  private detectStyling(): { preprocessor?: string; framework?: string; methodology?: string } {
    const result: { preprocessor?: string; framework?: string; methodology?: string } = {};

    // Check preprocessors from file extensions
    if (this.hasFilesMatching(/\.scss$/)) result.preprocessor = "SCSS";
    else if (this.hasFilesMatching(/\.less$/)) result.preprocessor = "LESS";
    else if (this.hasFilesMatching(/\.styl$/)) result.preprocessor = "Stylus";

    // Check UI frameworks from package.json
    for (const [name, packages] of Object.entries(STYLING_LIBS)) {
      if (packages.length > 0 && packages.some(p => this.allDeps.includes(p))) {
        if (["TailwindCSS", "Bootstrap", "Material UI", "Angular Material", "Chakra UI", "Ant Design", "PrimeNG", "PrimeReact"].includes(name)) {
          result.framework = name;
        } else if (!["SCSS", "LESS", "Stylus"].includes(name)) {
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

  private detectStateManagement(): { library?: string; pattern?: string } {
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

  private detectRouting(): { type?: string; routes: string[] } {
    const routes: string[] = [];
    let type: string | undefined;

    if (this.allDeps.includes("@angular/router")) {
      type = "Angular Router";
    } else if (this.allDeps.includes("react-router-dom") || this.allDeps.includes("react-router")) {
      type = "React Router";
    } else if (this.allDeps.includes("vue-router")) {
      type = "Vue Router";
    } else if (this.allDeps.includes("next")) {
      type = "File-based Routing (Next.js)";
    } else if (this.allDeps.includes("nuxt")) {
      type = "File-based Routing (Nuxt)";
    }

    return { type, routes };
  }

  private detectAPIStyle(): { client?: string; style?: string } {
    let client: string | undefined;
    let style = "REST";

    if (this.allDeps.includes("axios")) client = "Axios";
    else if (this.allDeps.includes("@angular/common")) client = "Angular HttpClient";
    else if (this.allDeps.includes("@tanstack/react-query")) client = "TanStack Query";
    else if (this.allDeps.includes("swr")) client = "SWR";
    else if (this.allDeps.includes("got")) client = "Got";

    if (this.allDeps.some(d => d.includes("graphql") || d.includes("apollo"))) {
      style = "GraphQL";
    } else if (this.allDeps.some(d => d.includes("trpc"))) {
      style = "tRPC";
    } else if (this.allDeps.some(d => d.includes("grpc")) || this.hasFilesMatching(/\.proto$/)) {
      style = "gRPC/Protobuf";
    }

    return { client, style };
  }

  private categorizeDependencies(): {
    production: DependencyInfo[];
    development: DependencyInfo[];
    byCategory: Record<string, DependencyInfo[]>;
  } {
    const production: DependencyInfo[] = [];
    const development: DependencyInfo[] = [];
    const byCategory: Record<string, DependencyInfo[]> = {};

    const categorize = (name: string): string => {
      for (const [category, packages] of Object.entries(DEPENDENCY_CATEGORIES)) {
        if (packages.some(p => name.includes(p) || name === p)) {
          return category;
        }
      }
      if (name.startsWith("@types/")) return "Type Definitions";
      if (name.includes("eslint") || name.includes("prettier")) return "Linting/Formatting";
      if (name.includes("test") || name.includes("spec")) return "Testing";
      return "Other";
    };

    if (this.packageJson) {
      for (const [name, version] of Object.entries(this.packageJson.dependencies || {})) {
        const category = categorize(name);
        const info: DependencyInfo = {
          name,
          version: String(version).replace(/[\^~]/, ""),
          type: "production",
          category
        };
        production.push(info);
        
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(info);
      }

      for (const [name, version] of Object.entries(this.packageJson.devDependencies || {})) {
        const category = categorize(name);
        const info: DependencyInfo = {
          name,
          version: String(version).replace(/[\^~]/, ""),
          type: "development",
          category
        };
        development.push(info);
        
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(info);
      }
    }

    // For non-JS projects, detect from build systems
    if (!this.packageJson && this.detectedBuildSystems.length > 0) {
      // Add build system as a "dependency"
      for (const system of this.detectedBuildSystems) {
        const info: DependencyInfo = {
          name: system,
          version: "detected",
          type: "production",
          category: "Build System"
        };
        production.push(info);
        if (!byCategory["Build System"]) byCategory["Build System"] = [];
        byCategory["Build System"].push(info);
      }
    }

    // Add detected test frameworks
    for (const framework of this.detectedTestFrameworks) {
      if (!production.some(d => d.name === framework) && !development.some(d => d.name === framework)) {
        const info: DependencyInfo = {
          name: framework,
          version: "detected",
          type: "development",
          category: "Testing"
        };
        development.push(info);
        if (!byCategory["Testing"]) byCategory["Testing"] = [];
        byCategory["Testing"].push(info);
      }
    }

    return { production, development, byCategory };
  }

  private hasDirectory(name: string): boolean {
    const paths = [
      path.join(this.rootPath, name),
      path.join(this.rootPath, "src", name)
    ];
    return paths.some(p => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
  }

  private hasFilesMatching(pattern: RegExp): boolean {
    let found = false;
    this.walkFiles((filePath) => {
      if (!found && pattern.test(filePath)) {
        found = true;
      }
    }, 4);
    return found;
  }

  private walkFiles(callback: (filePath: string) => void, maxDepth: number = 6, dir?: string, depth: number = 0): void {
    if (depth >= maxDepth) return;
    const currentDir = dir || this.rootPath;

    try {
      const entries = fs.readdirSync(currentDir);
      for (const entry of entries) {
        // Skip hidden folders and common non-source directories
        if (entry.startsWith(".") || 
            ["node_modules", "dist", "build", "coverage", ".git", "vendor", "__pycache__", 
             "target", "bin", "obj", ".vs", ".idea"].includes(entry)) {
          continue;
        }
        const fullPath = path.join(currentDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            this.walkFiles(callback, maxDepth, fullPath, depth + 1);
          } else {
            callback(fullPath);
          }
        } catch {
          // Skip
        }
      }
    } catch {
      // Skip
    }
  }
}
