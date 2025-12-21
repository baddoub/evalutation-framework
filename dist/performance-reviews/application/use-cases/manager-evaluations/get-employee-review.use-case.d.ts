import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface';
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface';
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service';
import { GetEmployeeReviewInput, GetEmployeeReviewOutput } from '../../dto/manager-evaluation.dto';
export declare class GetEmployeeReviewUseCase {
    private readonly userRepository;
    private readonly cycleRepository;
    private readonly selfReviewRepository;
    private readonly peerFeedbackRepository;
    private readonly managerEvaluationRepository;
    private readonly aggregationService;
    constructor(userRepository: IUserRepository, cycleRepository: IReviewCycleRepository, selfReviewRepository: ISelfReviewRepository, peerFeedbackRepository: IPeerFeedbackRepository, managerEvaluationRepository: IManagerEvaluationRepository, aggregationService: PeerFeedbackAggregationService);
    execute(input: GetEmployeeReviewInput): Promise<GetEmployeeReviewOutput>;
}
