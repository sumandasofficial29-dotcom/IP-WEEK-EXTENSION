import { RepoScanResult } from "../intelligence/repoScanner";
import { ScenarioType } from "../templates/scenarioBlueprints";
export declare class PromptAssembler {
    private templateRegistry;
    private compressor;
    assemble(task: string, scan: RepoScanResult, scenario: ScenarioType): string;
}
