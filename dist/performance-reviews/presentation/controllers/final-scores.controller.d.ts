import { CurrentUserData } from '../decorators/current-user.decorator';
import { DeliverFeedbackRequestDto, FinalScoreResponseDto, ScoreAdjustmentRequestDto, ScoreAdjustmentResponseDto } from '../dto/final-score.dto';
import { GetFinalScoreUseCase } from '../../application/use-cases/final-scores/get-final-score.use-case';
import { DeliverFeedbackUseCase } from '../../application/use-cases/final-scores/deliver-feedback.use-case';
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case';
import { ApproveScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/approve-score-adjustment.use-case';
export declare class FinalScoresController {
    private readonly getFinalScoreUseCase;
    private readonly deliverFeedbackUseCase;
    private readonly requestScoreAdjustmentUseCase;
    private readonly approveScoreAdjustmentUseCase;
    constructor(getFinalScoreUseCase: GetFinalScoreUseCase, deliverFeedbackUseCase: DeliverFeedbackUseCase, requestScoreAdjustmentUseCase: RequestScoreAdjustmentUseCase, approveScoreAdjustmentUseCase: ApproveScoreAdjustmentUseCase);
    getFinalScore(cycleId: string, employeeId: string): Promise<FinalScoreResponseDto>;
    getMyFinalScore(cycleId: string, user: CurrentUserData): Promise<FinalScoreResponseDto>;
    deliverFeedback(cycleId: string, employeeId: string, user: CurrentUserData, dto: DeliverFeedbackRequestDto): Promise<FinalScoreResponseDto>;
    requestScoreAdjustment(cycleId: string, employeeId: string, user: CurrentUserData, dto: ScoreAdjustmentRequestDto): Promise<ScoreAdjustmentResponseDto>;
    approveScoreAdjustment(adjustmentId: string, user: CurrentUserData, body: {
        reviewNotes?: string;
        approved: boolean;
    }): Promise<ScoreAdjustmentResponseDto>;
}
