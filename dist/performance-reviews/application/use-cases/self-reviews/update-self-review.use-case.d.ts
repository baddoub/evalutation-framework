import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { UpdateSelfReviewInput, UpdateSelfReviewOutput } from '../../dto/self-review.dto';
export declare class UpdateSelfReviewUseCase {
    private readonly selfReviewRepository;
    private readonly cycleRepository;
    constructor(selfReviewRepository: ISelfReviewRepository, cycleRepository: IReviewCycleRepository);
    execute(input: UpdateSelfReviewInput): Promise<UpdateSelfReviewOutput>;
}
