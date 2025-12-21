import { IScoreAdjustmentRequestRepository } from '../../../domain/repositories/score-adjustment-request.repository.interface';
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { RequestScoreAdjustmentInput, RequestScoreAdjustmentOutput } from '../../dto/final-score.dto';
export declare class RequestScoreAdjustmentUseCase {
    private readonly scoreAdjustmentRequestRepository;
    private readonly finalScoreRepository;
    private readonly cycleRepository;
    private readonly userRepository;
    constructor(scoreAdjustmentRequestRepository: IScoreAdjustmentRequestRepository, finalScoreRepository: IFinalScoreRepository, cycleRepository: IReviewCycleRepository, userRepository: IUserRepository);
    execute(input: RequestScoreAdjustmentInput): Promise<RequestScoreAdjustmentOutput>;
}
