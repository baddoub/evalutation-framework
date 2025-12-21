import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { LockFinalScoresInput, LockFinalScoresOutput } from '../../dto/final-score.dto';
export declare class LockFinalScoresUseCase {
    private readonly finalScoreRepository;
    private readonly cycleRepository;
    constructor(finalScoreRepository: IFinalScoreRepository, cycleRepository: IReviewCycleRepository);
    execute(input: LockFinalScoresInput): Promise<LockFinalScoresOutput>;
}
