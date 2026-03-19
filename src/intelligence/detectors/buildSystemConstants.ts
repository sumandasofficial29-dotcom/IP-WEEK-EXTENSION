/**
 * Build system signatures for detection
 */
export const BUILD_SYSTEM_SIGNATURES: Record<
  string,
  {
    files: string[];
    indicators: string[];
    language?: string;
  }
> = {
  // Enterprise C++ Build Systems (BMS-specific)
  BMS: {
    files: [".bms/**"],
    indicators: ["bms", "bmstmp", "localbmstmp"],
    language: "C++"
  },
  CMK: {
    files: [".cmk/**"],
    indicators: ["cmk", "component.xml"],
    language: "C++"
  },
  // C/C++ Build Systems
  CMake: {
    files: ["CMakeLists.txt", "cmake/**/*.cmake"],
    indicators: ["cmake", "cmake_minimum_required", "find_package"],
    language: "C/C++"
  },
  Make: {
    files: ["Makefile", "GNUmakefile", "makefile", "*.mk"],
    indicators: ["make", "gcc", "g++", "clang"],
    language: "C/C++"
  },
  Meson: {
    files: ["meson.build", "meson_options.txt"],
    indicators: ["meson"],
    language: "C/C++"
  },
  Bazel: {
    files: ["BUILD", "BUILD.bazel", "WORKSPACE", "WORKSPACE.bazel"],
    indicators: ["bazel", "blaze"]
  },
  Ninja: {
    files: ["build.ninja"],
    indicators: ["ninja"]
  },
  Autotools: {
    files: ["configure.ac", "Makefile.am", "configure"],
    indicators: ["autoconf", "automake"],
    language: "C/C++"
  },
  SCons: {
    files: ["SConstruct", "SConscript"],
    indicators: ["scons"],
    language: "C/C++"
  },
  Premake: {
    files: ["premake5.lua", "premake4.lua"],
    indicators: ["premake"],
    language: "C/C++"
  },
  QMake: {
    files: ["*.pro", "*.pri"],
    indicators: ["qmake", "Qt"],
    language: "C++"
  },
  Conan: {
    files: ["conanfile.py", "conanfile.txt"],
    indicators: ["conan"],
    language: "C/C++"
  },
  vcpkg: {
    files: ["vcpkg.json"],
    indicators: ["vcpkg"],
    language: "C/C++"
  },

  // Java/JVM Build Systems
  Maven: {
    files: ["pom.xml"],
    indicators: ["maven", "mvn"],
    language: "Java"
  },
  Gradle: {
    files: ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"],
    indicators: ["gradle"],
    language: "Java/Kotlin"
  },
  Ant: {
    files: ["build.xml"],
    indicators: ["ant"],
    language: "Java"
  },
  sbt: {
    files: ["build.sbt", "project/build.properties"],
    indicators: ["sbt"],
    language: "Scala"
  },

  // Python Build Systems
  pip: {
    files: ["requirements.txt", "requirements-dev.txt"],
    indicators: ["pip"],
    language: "Python"
  },
  Poetry: {
    files: ["pyproject.toml", "poetry.lock"],
    indicators: ["poetry"],
    language: "Python"
  },
  setuptools: {
    files: ["setup.py", "setup.cfg"],
    indicators: ["setuptools"],
    language: "Python"
  },
  Pipenv: {
    files: ["Pipfile", "Pipfile.lock"],
    indicators: ["pipenv"],
    language: "Python"
  },
  Conda: {
    files: ["environment.yml", "conda.yaml"],
    indicators: ["conda"],
    language: "Python"
  },

  // Rust
  Cargo: {
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
  MSBuild: {
    files: ["*.csproj", "*.vbproj", "*.fsproj", "*.sln"],
    indicators: ["msbuild", "dotnet"],
    language: "C#"
  },
  NuGet: {
    files: ["packages.config", "*.nuspec"],
    indicators: ["nuget"],
    language: "C#"
  },

  // Ruby
  Bundler: {
    files: ["Gemfile", "Gemfile.lock"],
    indicators: ["bundler", "gem"],
    language: "Ruby"
  },
  Rake: {
    files: ["Rakefile"],
    indicators: ["rake"],
    language: "Ruby"
  },

  // PHP
  Composer: {
    files: ["composer.json", "composer.lock"],
    indicators: ["composer"],
    language: "PHP"
  },

  // JavaScript/TypeScript
  npm: {
    files: ["package.json", "package-lock.json"],
    indicators: ["npm"],
    language: "JavaScript/TypeScript"
  },
  Yarn: {
    files: ["yarn.lock", ".yarnrc.yml"],
    indicators: ["yarn"],
    language: "JavaScript/TypeScript"
  },
  pnpm: {
    files: ["pnpm-lock.yaml", "pnpm-workspace.yaml"],
    indicators: ["pnpm"],
    language: "JavaScript/TypeScript"
  },
  Bun: {
    files: ["bun.lockb"],
    indicators: ["bun"],
    language: "JavaScript/TypeScript"
  },

  // Mobile
  CocoaPods: {
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

/**
 * Testing framework detection (multi-language)
 */
export const TESTING_FRAMEWORKS: Record<
  string,
  {
    files: string[];
    patterns: RegExp[];
    language?: string;
  }
> = {
  // Robot Framework
  "Robot Framework": {
    files: ["*.robot", "robot.yaml", "robot.yml"],
    patterns: [/\.robot$/, /profiles_regression/, /robot\.yaml/],
    language: "Python"
  },

  // Python
  pytest: {
    files: ["pytest.ini", "pyproject.toml", "conftest.py"],
    patterns: [/test_.*\.py$/, /.*_test\.py$/],
    language: "Python"
  },
  unittest: {
    files: [],
    patterns: [/test_.*\.py$/, /import unittest/],
    language: "Python"
  },
  nose: {
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
  Catch2: {
    files: ["catch.hpp", "catch2/**"],
    patterns: [/catch\.hpp/, /CATCH_|TEST_CASE/],
    language: "C++"
  },
  CppUnit: {
    files: [],
    patterns: [/cppunit/, /CPPUNIT_TEST/],
    language: "C++"
  },
  "Boost.Test": {
    files: [],
    patterns: [/boost\/test/, /BOOST_AUTO_TEST/],
    language: "C++"
  },
  CUnit: {
    files: [],
    patterns: [/CUnit/, /CU_ASSERT/],
    language: "C"
  },

  // Java
  JUnit: {
    files: [],
    patterns: [/@Test/, /junit/, /\.java$/],
    language: "Java"
  },
  TestNG: {
    files: ["testng.xml"],
    patterns: [/testng/, /@Test/],
    language: "Java"
  },
  Mockito: {
    files: [],
    patterns: [/mockito/, /@Mock/],
    language: "Java"
  },

  // JavaScript/TypeScript
  Jest: {
    files: ["jest.config.js", "jest.config.ts", "jest.config.json"],
    patterns: [/\.test\.(ts|js|tsx|jsx)$/, /\.spec\.(ts|js|tsx|jsx)$/],
    language: "JavaScript/TypeScript"
  },
  Vitest: {
    files: ["vitest.config.ts", "vitest.config.js"],
    patterns: [/\.test\.(ts|js)$/, /vitest/],
    language: "JavaScript/TypeScript"
  },
  Mocha: {
    files: [".mocharc.js", ".mocharc.json", "mocha.opts"],
    patterns: [/describe\(|it\(/],
    language: "JavaScript/TypeScript"
  },
  Karma: {
    files: ["karma.conf.js"],
    patterns: [/karma/],
    language: "JavaScript/TypeScript"
  },
  Jasmine: {
    files: ["jasmine.json"],
    patterns: [/jasmine/, /describe\(|it\(/],
    language: "JavaScript/TypeScript"
  },
  Cypress: {
    files: ["cypress.config.js", "cypress.config.ts", "cypress/**"],
    patterns: [/cypress/, /cy\./],
    language: "JavaScript/TypeScript"
  },
  Playwright: {
    files: ["playwright.config.ts", "playwright.config.js"],
    patterns: [/playwright/, /test\(/],
    language: "JavaScript/TypeScript"
  },

  // Cucumber/BDD
  Cucumber: {
    files: ["cucumber.js", "*.feature"],
    patterns: [/\.feature$/, /Given|When|Then/]
  },
  Behave: {
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
  xUnit: {
    files: [],
    patterns: [/xunit/, /\[Fact\]|\[Theory\]/],
    language: "C#"
  },
  NUnit: {
    files: [],
    patterns: [/nunit/, /\[Test\]|\[TestCase\]/],
    language: "C#"
  },
  MSTest: {
    files: [],
    patterns: [/mstest/, /\[TestMethod\]/],
    language: "C#"
  }
};
