import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
export interface DeliverFeedbackInput {
    finalScoreId: string;
    deliveredBy: string;
    feedbackNotes?: string;
}
export interface DeliverFeedbackOutput {
    id: string;
    employeeId: string;
    cycleId: string;
    feedbackDelivered: boolean;
    feedbackNotes?: string;
    deliveredAt: Date;
    deliveredBy: string;
    weightedScore: number;
    percentageScore: number;
    bonusTier: string;
}
export declare class DeliverFeedbackUseCase {
    private readonly finalScoreRepository;
    constructor(finalScoreRepository: IFinalScoreRepository);
    execute(input: DeliverFeedbackInput): Promise<DeliverFeedbackOutput>;
}
