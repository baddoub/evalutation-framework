import { CreateReviewCycleRequestDto, ReviewCycleResponseDto } from '../dto/review-cycle.dto';
import { CreateReviewCycleUseCase } from '../../application/use-cases/review-cycles/create-review-cycle.use-case';
import { ActivateReviewCycleUseCase } from '../../application/use-cases/review-cycles/activate-review-cycle.use-case';
import { GetReviewCycleUseCase } from '../../application/use-cases/review-cycles/get-review-cycle.use-case';
export declare class ReviewCyclesController {
    private readonly createReviewCycleUseCase;
    private readonly activateReviewCycleUseCase;
    private readonly getReviewCycleUseCase;
    constructor(createReviewCycleUseCase: CreateReviewCycleUseCase, activateReviewCycleUseCase: ActivateReviewCycleUseCase, getReviewCycleUseCase: GetReviewCycleUseCase);
    createReviewCycle(dto: CreateReviewCycleRequestDto): Promise<ReviewCycleResponseDto>;
    getReviewCycle(cycleId: string): Promise<ReviewCycleResponseDto>;
    activateReviewCycle(cycleId: string): Promise<ReviewCycleResponseDto>;
}
