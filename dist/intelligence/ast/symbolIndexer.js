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
exports.extractClasses = extractClasses;
const ts = __importStar(require("typescript"));
const astParser_1 = require("./astParser");
function extractClasses(filePath) {
    const sourceFile = (0, astParser_1.parseFile)(filePath);
    if (!sourceFile)
        return [];
    // Store in const to help TypeScript narrow the type in nested function
    const sf = sourceFile;
    const classes = [];
    function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.text;
            // Extract decorators
            const decorators = [];
            const modifiers = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
            if (modifiers) {
                for (const decorator of modifiers) {
                    decorators.push(decorator.getText(sf));
                }
            }
            const methods = [];
            node.members.forEach(member => {
                if (ts.isMethodDeclaration(member) && member.name) {
                    const name = member.name.getText(sf);
                    const parameters = member.parameters.map(p => p.name.getText(sf));
                    const returnType = member.type?.getText(sf) || "void";
                    methods.push({
                        name,
                        parameters,
                        returnType
                    });
                }
            });
            const constructorParams = [];
            node.members.forEach(member => {
                if (ts.isConstructorDeclaration(member)) {
                    member.parameters.forEach(p => {
                        constructorParams.push(p.type?.getText(sf) || "any");
                    });
                }
            });
            classes.push({
                name: className,
                filePath,
                decorators,
                methods,
                constructorParams
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return classes;
}
//# sourceMappingURL=symbolIndexer.js.map