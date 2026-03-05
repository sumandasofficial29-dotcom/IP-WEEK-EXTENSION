export declare class PromptEngine {
    private scanner;
    private assembler;
    private resolver;
    generate(root: string, userInput: string): Promise<string>;
}
