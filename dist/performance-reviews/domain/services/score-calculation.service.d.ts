import { PillarScores } from '../value-objects/pillar-scores.vo';
import { EngineerLevel } from '../value-objects/engineer-level.vo';
import { WeightedScore } from '../value-objects/weighted-score.vo';
export interface PillarWeights {
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
}
export declare class ScoreCalculationService {
    private static readonly WEIGHTS_BY_LEVEL;
    calculateWeightedScore(pillarScores: PillarScores, level: EngineerLevel): WeightedScore;
    private getWeightsForLevel;
    static getAllWeights(): Record<string, PillarWeights>;
}
