import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface';
import { IPeerNominationRepository } from '../../../domain/repositories/peer-nomination.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { SubmitPeerFeedbackInput, SubmitPeerFeedbackOutput } from '../../dto/peer-feedback.dto';
export declare class SubmitPeerFeedbackUseCase {
    private readonly peerFeedbackRepository;
    private readonly peerNominationRepository;
    private readonly cycleRepository;
    constructor(peerFeedbackRepository: IPeerFeedbackRepository, peerNominationRepository: IPeerNominationRepository, cycleRepository: IReviewCycleRepository);
    execute(input: SubmitPeerFeedbackInput): Promise<SubmitPeerFeedbackOutput>;
}
