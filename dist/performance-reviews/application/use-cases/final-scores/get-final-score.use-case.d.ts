import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
export interface GetFinalScoreOutput {
    id: string;
    employeeId: string;
    cycleId: string;
    finalScores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    weightedScore: number;
    percentageScore: number;
    bonusTier: string;
    finalLevel: string;
    calculatedAt: Date;
    feedbackDelivered: boolean;
    feedbackNotes?: string;
    deliveredAt?: Date;
    deliveredBy?: string;
}
export declare class GetFinalScoreUseCase {
    private readonly finalScoreRepository;
    constructor(finalScoreRepository: IFinalScoreRepository);
    execute(employeeId: string, cycleId: string): Promise<GetFinalScoreOutput | null>;
}
