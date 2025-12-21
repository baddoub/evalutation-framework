import { IScoreAdjustmentRequestRepository } from '../../../domain/repositories/score-adjustment-request.repository.interface';
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { ReviewScoreAdjustmentInput, ReviewScoreAdjustmentOutput } from '../../dto/final-score.dto';
export declare class ReviewScoreAdjustmentUseCase {
    private readonly scoreAdjustmentRequestRepository;
    private readonly finalScoreRepository;
    private readonly managerEvaluationRepository;
    constructor(scoreAdjustmentRequestRepository: IScoreAdjustmentRequestRepository, finalScoreRepository: IFinalScoreRepository, managerEvaluationRepository: IManagerEvaluationRepository);
    execute(input: ReviewScoreAdjustmentInput): Promise<ReviewScoreAdjustmentOutput>;
}
