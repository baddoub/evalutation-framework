import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { CreateReviewCycleInput, CreateReviewCycleOutput } from '../../dto/review-cycle.dto';
export declare class CreateReviewCycleUseCase {
    private readonly reviewCycleRepository;
    constructor(reviewCycleRepository: IReviewCycleRepository);
    execute(input: CreateReviewCycleInput): Promise<CreateReviewCycleOutput>;
}
