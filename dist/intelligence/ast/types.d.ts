export interface MethodInfo {
    name: string;
    parameters: string[];
    returnType: string;
}
export interface ClassInfo {
    name: string;
    filePath: string;
    decorators: string[];
    methods: MethodInfo[];
    constructorParams: string[];
}
export interface RepoStructure {
    classes: ClassInfo[];
    services: ClassInfo[];
    components: ClassInfo[];
    utils: ClassInfo[];
}
