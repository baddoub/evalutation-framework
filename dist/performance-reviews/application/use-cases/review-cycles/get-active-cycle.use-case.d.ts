import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { GetActiveCycleOutput } from '../../dto/review-cycle.dto';
export declare class GetActiveCycleUseCase {
    private readonly reviewCycleRepository;
    constructor(reviewCycleRepository: IReviewCycleRepository);
    execute(): Promise<GetActiveCycleOutput | null>;
}
