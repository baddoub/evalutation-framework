import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { GetMySelfReviewInput, GetMySelfReviewOutput } from '../../dto/self-review.dto';
export declare class GetMySelfReviewUseCase {
    private readonly selfReviewRepository;
    private readonly cycleRepository;
    constructor(selfReviewRepository: ISelfReviewRepository, cycleRepository: IReviewCycleRepository);
    execute(input: GetMySelfReviewInput): Promise<GetMySelfReviewOutput>;
}
