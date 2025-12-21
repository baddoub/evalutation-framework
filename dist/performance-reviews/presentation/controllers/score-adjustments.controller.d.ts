import { CurrentUserData } from '../decorators/current-user.decorator';
import { ScoreAdjustmentRequestDto, ScoreAdjustmentResponseDto } from '../dto/final-score.dto';
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case';
import { ReviewScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/review-score-adjustment.use-case';
export declare class ScoreAdjustmentsController {
    private readonly requestScoreAdjustmentUseCase;
    private readonly reviewScoreAdjustmentUseCase;
    constructor(requestScoreAdjustmentUseCase: RequestScoreAdjustmentUseCase, reviewScoreAdjustmentUseCase: ReviewScoreAdjustmentUseCase);
    requestScoreAdjustment(cycleId: string, employeeId: string, dto: ScoreAdjustmentRequestDto, currentUser: CurrentUserData): Promise<ScoreAdjustmentResponseDto>;
    reviewScoreAdjustment(requestId: string, dto: {
        action: 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
    }, currentUser: CurrentUserData): Promise<ScoreAdjustmentResponseDto>;
}
