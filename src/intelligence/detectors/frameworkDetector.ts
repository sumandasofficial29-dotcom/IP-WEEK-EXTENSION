import * as fs from "fs";
import * as path from "path";
import { FrameworkInfo } from "./detectorTypes";
import { DetectorContext, hasLanguageFiles, hasFilesMatching, hasCodePattern, getVersion } from "./detectorContext";
import { FRAMEWORK_SIGNATURES } from "./frameworkConstants";
import { CppBMSDetector } from "./cppDetector";

/**
 * Detect all frameworks in the project
 */
export function detectFrameworks(context: DetectorContext): FrameworkInfo[] {
  const detected: FrameworkInfo[] = [];

  // JavaScript/TypeScript frameworks (from package.json)
  for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
    let confidence = 0;
    const indicators: string[] = [];

    // Check packages
    for (const pkg of sig.packages) {
      if (context.allDeps.includes(pkg)) {
        confidence += 50;
        indicators.push(`package: ${pkg}`);
      }
    }

    // Check config files
    for (const file of sig.files) {
      if (fs.existsSync(path.join(context.rootPath, file))) {
        confidence += 40;
        indicators.push(`config: ${file}`);
      }
    }

    if (confidence > 0) {
      detected.push({
        name,
        version: getVersion(context, sig.packages[0]),
        confidence: Math.min(100, confidence),
        indicators
      });
    }
  }

  // C++ frameworks detection (from file patterns)
  if (hasLanguageFiles(context, [".cpp", ".cc", ".cxx", ".hpp", ".h"])) {
    // C++ BMS/MDW Detection (check first as it's most specific)
    const cppBmsDetector = new CppBMSDetector(context.rootPath);
    const bms = cppBmsDetector.detect();
    if (bms.isBms && bms.bmsInfo) {
      detected.push({
        name: "C++ BMS/MDW",
        version: bms.bmsInfo.middlewareVersion,
        confidence: 95,
        indicators: bms.indicators
      });
    }

    // Qt Detection
    if (
      hasFilesMatching(context.rootPath, /\.pro$/) ||
      hasFilesMatching(context.rootPath, /\.pri$/) ||
      hasCodePattern(context.rootPath, /Q_OBJECT|QWidget|QMainWindow|#include\s*<Q/)
    ) {
      detected.push({
        name: "Qt",
        confidence: 85,
        indicators: ["Qt project files (.pro/.pri)", "Qt includes or macros"]
      });
    }

    // Boost Detection
    if (hasCodePattern(context.rootPath, /boost::|#include\s*<boost\//)) {
      detected.push({
        name: "Boost",
        confidence: 80,
        indicators: ["Boost includes"]
      });
    }

    // STL/Standard C++
    if (
      hasCodePattern(
        context.rootPath,
        /#include\s*<(vector|map|string|memory|algorithm|iostream)/
      )
    ) {
      detected.push({
        name: "C++ STL",
        confidence: 90,
        indicators: ["STL headers"]
      });
    }
  }

  // Python frameworks detection
  if (hasLanguageFiles(context, [".py"])) {
    // Django
    if (
      fs.existsSync(path.join(context.rootPath, "manage.py")) ||
      hasCodePattern(context.rootPath, /from django|import django/)
    ) {
      detected.push({
        name: "Django",
        confidence: 90,
        indicators: ["manage.py or django imports"]
      });
    }

    // Flask
    if (hasCodePattern(context.rootPath, /from flask|import flask|Flask\(__name__\)/)) {
      detected.push({
        name: "Flask",
        confidence: 85,
        indicators: ["Flask imports"]
      });
    }

    // FastAPI
    if (hasCodePattern(context.rootPath, /from fastapi|import fastapi|FastAPI\(\)/)) {
      detected.push({
        name: "FastAPI",
        confidence: 85,
        indicators: ["FastAPI imports"]
      });
    }
  }

  // Robot Framework detection
  if (hasFilesMatching(context.rootPath, /\.robot$/)) {
    detected.push({
      name: "Robot Framework",
      confidence: 95,
      indicators: [".robot test files"]
    });
  }

  // Protocol Buffers detection
  if (hasFilesMatching(context.rootPath, /\.proto$/)) {
    detected.push({
      name: "Protocol Buffers",
      confidence: 90,
      indicators: [".proto files"]
    });
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}
