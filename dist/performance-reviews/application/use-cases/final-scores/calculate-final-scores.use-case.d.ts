import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { FinalScoreCalculationService } from '../../../domain/services/final-score-calculation.service';
export declare class CalculateFinalScoresUseCase {
    private readonly finalScoreRepository;
    private readonly managerEvaluationRepository;
    private readonly calculationService;
    constructor(finalScoreRepository: IFinalScoreRepository, managerEvaluationRepository: IManagerEvaluationRepository, calculationService: FinalScoreCalculationService);
    execute(cycleId: string): Promise<void>;
}
