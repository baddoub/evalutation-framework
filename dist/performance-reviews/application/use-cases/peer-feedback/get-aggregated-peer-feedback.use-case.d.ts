import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface';
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service';
export interface AggregatedPeerFeedbackOutput {
    employeeId: string;
    cycleId: string;
    aggregatedScores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    feedbackCount: number;
    anonymizedComments: Array<{
        pillar: string;
        comment: string;
    }>;
}
export declare class GetAggregatedPeerFeedbackUseCase {
    private readonly peerFeedbackRepository;
    private readonly aggregationService;
    constructor(peerFeedbackRepository: IPeerFeedbackRepository, aggregationService: PeerFeedbackAggregationService);
    execute(employeeId: string, cycleId: string): Promise<AggregatedPeerFeedbackOutput>;
}
