import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { StartReviewCycleInput, StartReviewCycleOutput } from '../../dto/review-cycle.dto';
export declare class StartReviewCycleUseCase {
    private readonly reviewCycleRepository;
    constructor(reviewCycleRepository: IReviewCycleRepository);
    execute(input: StartReviewCycleInput): Promise<StartReviewCycleOutput>;
}
