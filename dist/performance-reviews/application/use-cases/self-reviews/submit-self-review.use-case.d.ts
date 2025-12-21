import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { SubmitSelfReviewInput, SubmitSelfReviewOutput } from '../../dto/self-review.dto';
export declare class SubmitSelfReviewUseCase {
    private readonly selfReviewRepository;
    private readonly cycleRepository;
    constructor(selfReviewRepository: ISelfReviewRepository, cycleRepository: IReviewCycleRepository);
    execute(input: SubmitSelfReviewInput): Promise<SubmitSelfReviewOutput>;
}
