import { CppBMSResult } from "./detectorTypes";
/**
 * Detects C++ BMS/MDW project characteristics
 */
export declare class CppBMSDetector {
    private rootPath;
    constructor(rootPath: string);
    detect(): CppBMSResult;
    private walkFiles;
}
