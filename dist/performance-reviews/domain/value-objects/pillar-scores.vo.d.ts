import { PillarScore } from './pillar-score.vo';
export declare class PillarScores {
    private readonly _projectImpact;
    private readonly _direction;
    private readonly _engineeringExcellence;
    private readonly _operationalOwnership;
    private readonly _peopleImpact;
    private constructor();
    static create(scores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    }): PillarScores;
    get projectImpact(): PillarScore;
    get direction(): PillarScore;
    get engineeringExcellence(): PillarScore;
    get operationalOwnership(): PillarScore;
    get peopleImpact(): PillarScore;
    toObject(): {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    toPlainObject(): {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    equals(other: PillarScores): boolean;
}
