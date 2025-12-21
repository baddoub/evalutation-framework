import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service';
import { GetPeerFeedbackInput, GetPeerFeedbackOutput } from '../../dto/peer-feedback.dto';
export declare class GetPeerFeedbackUseCase {
    private readonly peerFeedbackRepository;
    private readonly cycleRepository;
    private readonly aggregationService;
    constructor(peerFeedbackRepository: IPeerFeedbackRepository, cycleRepository: IReviewCycleRepository, aggregationService: PeerFeedbackAggregationService);
    execute(input: GetPeerFeedbackInput): Promise<GetPeerFeedbackOutput>;
}
