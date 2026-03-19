import * as fs from "fs";
import * as path from "path";
import { DetectorContext } from "./detectorContext";

/**
 * Comprehensive file extension to language map
 */
const FILE_EXTENSION_LANGUAGES: Record<string, string> = {
  // C/C++
  ".c": "C",
  ".h": "C/C++ Header",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".c++": "C++",
  ".hpp": "C++ Header",
  ".hh": "C++ Header",
  ".hxx": "C++ Header",
  ".h++": "C++ Header",
  ".ipp": "C++ Implementation",

  // JavaScript/TypeScript
  ".js": "JavaScript",
  ".jsx": "JavaScript (JSX)",
  ".mjs": "JavaScript (ES Module)",
  ".ts": "TypeScript",
  ".tsx": "TypeScript (TSX)",
  ".mts": "TypeScript (ES Module)",
  ".d.ts": "TypeScript Declarations",

  // Python
  ".py": "Python",
  ".pyw": "Python",
  ".pyi": "Python (Stub)",
  ".pyx": "Cython",
  ".pxd": "Cython Declaration",

  // Java/JVM
  ".java": "Java",
  ".kt": "Kotlin",
  ".kts": "Kotlin Script",
  ".scala": "Scala",
  ".groovy": "Groovy",
  ".clj": "Clojure",

  // C#/.NET
  ".cs": "C#",
  ".vb": "Visual Basic",
  ".fs": "F#",
  ".fsx": "F# Script",

  // System/Low-level
  ".rs": "Rust",
  ".go": "Go",
  ".zig": "Zig",
  ".nim": "Nim",
  ".d": "D",
  ".asm": "Assembly",
  ".s": "Assembly",

  // Web/Markup
  ".html": "HTML",
  ".htm": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".astro": "Astro",

  // Shell/Scripts
  ".sh": "Shell (Bash)",
  ".bash": "Bash",
  ".zsh": "Zsh",
  ".fish": "Fish",
  ".ps1": "PowerShell",
  ".psm1": "PowerShell Module",
  ".bat": "Batch",
  ".cmd": "Batch",

  // Configuration/Data
  ".json": "JSON",
  ".json5": "JSON5",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".xsd": "XML Schema",
  ".xsl": "XSLT",
  ".toml": "TOML",
  ".ini": "INI",
  ".env": "Environment Config",
  ".properties": "Properties",

  // Database
  ".sql": "SQL",
  ".plsql": "PL/SQL",
  ".pls": "PL/SQL",
  ".prisma": "Prisma Schema",

  // Protocol/Serialization
  ".proto": "Protocol Buffers",
  ".thrift": "Thrift",
  ".avsc": "Avro Schema",
  ".fbs": "FlatBuffers",

  // Testing
  ".robot": "Robot Framework",
  ".feature": "Gherkin/Cucumber",
  ".spec.ts": "TypeScript Test",
  ".spec.js": "JavaScript Test",
  ".test.ts": "TypeScript Test",
  ".test.js": "JavaScript Test",

  // Documentation
  ".md": "Markdown",
  ".mdx": "MDX",
  ".rst": "reStructuredText",
  ".adoc": "AsciiDoc",
  ".tex": "LaTeX",

  // Ruby
  ".rb": "Ruby",
  ".erb": "ERB Template",
  ".rake": "Rake",
  ".gemspec": "Gem Spec",

  // PHP
  ".php": "PHP",
  ".phtml": "PHP Template",
  ".blade.php": "Blade Template",

  // Swift/Objective-C
  ".swift": "Swift",
  ".m": "Objective-C",
  ".mm": "Objective-C++",

  // Other
  ".lua": "Lua",
  ".r": "R",
  ".R": "R",
  ".pl": "Perl",
  ".pm": "Perl Module",
  ".ex": "Elixir",
  ".exs": "Elixir Script",
  ".erl": "Erlang",
  ".hrl": "Erlang Header",
  ".dart": "Dart",
  ".jl": "Julia",
  ".ml": "OCaml",
  ".mli": "OCaml Interface",
  ".hs": "Haskell",
  ".lhs": "Literate Haskell",
  ".elm": "Elm",
  ".v": "Verilog",
  ".sv": "SystemVerilog",
  ".vhdl": "VHDL",
  ".vhd": "VHDL",
  ".sol": "Solidity",
  ".move": "Move",
  ".wasm": "WebAssembly",
  ".wat": "WebAssembly Text"
};

const CONFIG_EXTENSIONS = new Set([
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".toml",
  ".ini",
  ".env",
  ".properties",
  ".config",
  ".conf",
  ".data",
  ".dat",
  ".csv",
  ".tsv",
  ".lock",
  ".log",
  ".md",
  ".txt",
  ".rst"
]);

function hasDirectory(rootPath: string, name: string): boolean {
  const paths = [path.join(rootPath, name), path.join(rootPath, "src", name)];
  return paths.some((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Detect primary programming language
 */
export function detectPrimaryLanguage(context: DetectorContext): string {
  // Enterprise C++ detection (check for .bms or .cmk directories with significant C++ files)
  if (hasDirectory(context.rootPath, ".bms") || hasDirectory(context.rootPath, ".cmk")) {
    const cppFileCount =
      (context.fileExtensionCounts[".cpp"] || 0) +
      (context.fileExtensionCounts[".cc"] || 0) +
      (context.fileExtensionCounts[".cxx"] || 0);
    if (cppFileCount >= 10) {
      // Need substantial C++ files
      return "C++";
    }
  }

  // Use SOURCE files for language detection (not config/data)
  const countsToUse =
    context.totalSourceFiles > 50
      ? context.sourceFileExtensionCounts
      : context.fileExtensionCounts;

  // File extension-based detection
  const languageCounts: Record<string, number> = {};

  for (const [ext, count] of Object.entries(countsToUse)) {
    const lang = FILE_EXTENSION_LANGUAGES[ext];
    if (lang && !lang.includes("Header") && !lang.includes("Config")) {
      // Skip data/config extensions
      if (CONFIG_EXTENSIONS.has(ext)) continue;

      // Group related languages
      let normalizedLang = lang;
      if (lang.includes("JavaScript")) normalizedLang = "JavaScript";
      if (lang.includes("TypeScript")) normalizedLang = "TypeScript";
      if (lang === "C" || lang === "C/C++ Header") normalizedLang = "C";
      if (lang.includes("C++")) normalizedLang = "C++";

      languageCounts[normalizedLang] = (languageCounts[normalizedLang] || 0) + count;
    }
  }

  // C/C++ headers count toward C++
  const headerCount = (countsToUse[".h"] || 0) + (countsToUse[".hpp"] || 0);
  if (headerCount > 0 && languageCounts["C++"]) {
    languageCounts["C++"] += Math.floor(headerCount * 0.5);
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
  if (primaryLang === "JavaScript" && countsToUse[".ts"]) {
    if (countsToUse[".ts"] > (countsToUse[".js"] || 0) / 2) {
      return "TypeScript";
    }
  }

  return primaryLang;
}

/**
 * Detect all languages with percentages
 */
export function detectLanguages(
  context: DetectorContext
): { name: string; percentage: number }[] {
  // Use source files for accurate language percentages
  const countsToUse =
    context.totalSourceFiles > 50
      ? context.sourceFileExtensionCounts
      : context.fileExtensionCounts;

  const languageCounts: Record<string, number> = {};
  let total = 0;

  for (const [ext, count] of Object.entries(countsToUse)) {
    const lang = FILE_EXTENSION_LANGUAGES[ext];
    if (lang) {
      // Skip config/data extensions for language percentage
      if (CONFIG_EXTENSIONS.has(ext)) continue;

      // Normalize language names
      let normalizedLang = lang;
      if (lang.includes("JavaScript")) normalizedLang = "JavaScript";
      if (lang.includes("TypeScript")) normalizedLang = "TypeScript";
      if (lang === "C/C++ Header") normalizedLang = "C++ Header";
      if (lang.includes("C++") && !lang.includes("Header")) normalizedLang = "C++";

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
    .filter((l) => l.percentage >= 1) // Only show languages with at least 1%
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10); // Top 10 languages
}
