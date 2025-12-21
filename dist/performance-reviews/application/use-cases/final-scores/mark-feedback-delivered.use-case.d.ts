import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { MarkFeedbackDeliveredInput, MarkFeedbackDeliveredOutput } from '../../dto/final-score.dto';
export declare class MarkFeedbackDeliveredUseCase {
    private readonly finalScoreRepository;
    private readonly cycleRepository;
    private readonly userRepository;
    constructor(finalScoreRepository: IFinalScoreRepository, cycleRepository: IReviewCycleRepository, userRepository: IUserRepository);
    execute(input: MarkFeedbackDeliveredInput): Promise<MarkFeedbackDeliveredOutput>;
}
