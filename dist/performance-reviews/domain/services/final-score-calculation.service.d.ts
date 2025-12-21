import { ManagerEvaluation } from '../entities/manager-evaluation.entity';
import { FinalScore } from '../entities/final-score.entity';
import { ScoreCalculationService } from './score-calculation.service';
export declare class FinalScoreCalculationService {
    private readonly scoreCalculationService;
    constructor(scoreCalculationService: ScoreCalculationService);
    calculateFinalScore(evaluation: ManagerEvaluation): FinalScore;
}
