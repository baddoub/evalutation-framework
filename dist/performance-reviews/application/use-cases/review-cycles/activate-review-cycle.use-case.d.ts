import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
export interface ActivateReviewCycleOutput {
    id: string;
    name: string;
    status: string;
    activatedAt: Date;
}
export declare class ActivateReviewCycleUseCase {
    private readonly reviewCycleRepository;
    constructor(reviewCycleRepository: IReviewCycleRepository);
    execute(cycleId: string): Promise<ActivateReviewCycleOutput>;
}
