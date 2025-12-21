import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { ReviewCycleDto } from '../../dto/review-cycle.dto';
export declare class GetReviewCycleUseCase {
    private readonly reviewCycleRepository;
    constructor(reviewCycleRepository: IReviewCycleRepository);
    execute(cycleId: string): Promise<ReviewCycleDto>;
}
