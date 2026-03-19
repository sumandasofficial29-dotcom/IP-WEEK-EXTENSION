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
exports.detectFrameworks = detectFrameworks;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const detectorContext_1 = require("./detectorContext");
const frameworkConstants_1 = require("./frameworkConstants");
const cppDetector_1 = require("./cppDetector");
/**
 * Detect all frameworks in the project
 */
function detectFrameworks(context) {
    const detected = [];
    // JavaScript/TypeScript frameworks (from package.json)
    for (const [name, sig] of Object.entries(frameworkConstants_1.FRAMEWORK_SIGNATURES)) {
        let confidence = 0;
        const indicators = [];
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
                version: (0, detectorContext_1.getVersion)(context, sig.packages[0]),
                confidence: Math.min(100, confidence),
                indicators
            });
        }
    }
    // C++ frameworks detection (from file patterns)
    if ((0, detectorContext_1.hasLanguageFiles)(context, [".cpp", ".cc", ".cxx", ".hpp", ".h"])) {
        // C++ BMS/MDW Detection (check first as it's most specific)
        const cppBmsDetector = new cppDetector_1.CppBMSDetector(context.rootPath);
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
        if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.pro$/) ||
            (0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.pri$/) ||
            (0, detectorContext_1.hasCodePattern)(context.rootPath, /Q_OBJECT|QWidget|QMainWindow|#include\s*<Q/)) {
            detected.push({
                name: "Qt",
                confidence: 85,
                indicators: ["Qt project files (.pro/.pri)", "Qt includes or macros"]
            });
        }
        // Boost Detection
        if ((0, detectorContext_1.hasCodePattern)(context.rootPath, /boost::|#include\s*<boost\//)) {
            detected.push({
                name: "Boost",
                confidence: 80,
                indicators: ["Boost includes"]
            });
        }
        // STL/Standard C++
        if ((0, detectorContext_1.hasCodePattern)(context.rootPath, /#include\s*<(vector|map|string|memory|algorithm|iostream)/)) {
            detected.push({
                name: "C++ STL",
                confidence: 90,
                indicators: ["STL headers"]
            });
        }
    }
    // Python frameworks detection
    if ((0, detectorContext_1.hasLanguageFiles)(context, [".py"])) {
        // Django
        if (fs.existsSync(path.join(context.rootPath, "manage.py")) ||
            (0, detectorContext_1.hasCodePattern)(context.rootPath, /from django|import django/)) {
            detected.push({
                name: "Django",
                confidence: 90,
                indicators: ["manage.py or django imports"]
            });
        }
        // Flask
        if ((0, detectorContext_1.hasCodePattern)(context.rootPath, /from flask|import flask|Flask\(__name__\)/)) {
            detected.push({
                name: "Flask",
                confidence: 85,
                indicators: ["Flask imports"]
            });
        }
        // FastAPI
        if ((0, detectorContext_1.hasCodePattern)(context.rootPath, /from fastapi|import fastapi|FastAPI\(\)/)) {
            detected.push({
                name: "FastAPI",
                confidence: 85,
                indicators: ["FastAPI imports"]
            });
        }
    }
    // Robot Framework detection
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.robot$/)) {
        detected.push({
            name: "Robot Framework",
            confidence: 95,
            indicators: [".robot test files"]
        });
    }
    // Protocol Buffers detection
    if ((0, detectorContext_1.hasFilesMatching)(context.rootPath, /\.proto$/)) {
        detected.push({
            name: "Protocol Buffers",
            confidence: 90,
            indicators: [".proto files"]
        });
    }
    return detected.sort((a, b) => b.confidence - a.confidence);
}
//# sourceMappingURL=frameworkDetector.js.map