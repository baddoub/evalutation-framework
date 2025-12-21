import { CurrentUserData } from '../decorators/current-user.decorator';
import { UpdateSelfReviewRequestDto, SelfReviewResponseDto } from '../dto/self-review.dto';
import { GetMySelfReviewUseCase } from '../../application/use-cases/self-reviews/get-my-self-review.use-case';
import { UpdateSelfReviewUseCase } from '../../application/use-cases/self-reviews/update-self-review.use-case';
import { SubmitSelfReviewUseCase } from '../../application/use-cases/self-reviews/submit-self-review.use-case';
export declare class SelfReviewsController {
    private readonly getMySelfReviewUseCase;
    private readonly updateSelfReviewUseCase;
    private readonly submitSelfReviewUseCase;
    constructor(getMySelfReviewUseCase: GetMySelfReviewUseCase, updateSelfReviewUseCase: UpdateSelfReviewUseCase, submitSelfReviewUseCase: SubmitSelfReviewUseCase);
    getMySelfReview(cycleId: string, user: CurrentUserData): Promise<SelfReviewResponseDto>;
    updateMySelfReview(cycleId: string, user: CurrentUserData, dto: UpdateSelfReviewRequestDto): Promise<SelfReviewResponseDto>;
    submitMySelfReview(cycleId: string, user: CurrentUserData): Promise<{
        id: string;
        status: string;
        submittedAt: string;
    }>;
}
