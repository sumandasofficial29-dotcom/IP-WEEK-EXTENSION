import { ScenarioType } from "../templates/scenarioBlueprints";
export declare function resolveIntent(prompt: string): ScenarioType;
export declare class IntentResolver {
    resolve(input: string): ScenarioType;
}
