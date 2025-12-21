import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { ScoreCalculationService } from '../../../domain/services/score-calculation.service';
import { GetCalibrationDashboardInput, GetCalibrationDashboardOutput } from '../../dto/final-score.dto';
export declare class GetCalibrationDashboardUseCase {
    private readonly cycleRepository;
    private readonly managerEvaluationRepository;
    private readonly userRepository;
    private readonly scoreCalculationService;
    constructor(cycleRepository: IReviewCycleRepository, managerEvaluationRepository: IManagerEvaluationRepository, userRepository: IUserRepository, scoreCalculationService: ScoreCalculationService);
    execute(input: GetCalibrationDashboardInput): Promise<GetCalibrationDashboardOutput>;
}
