import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { ScoreCalculationService } from '../../../domain/services/score-calculation.service';
import { ApplyCalibrationAdjustmentInput, ApplyCalibrationAdjustmentOutput } from '../../dto/final-score.dto';
export declare class ApplyCalibrationAdjustmentUseCase {
    private readonly managerEvaluationRepository;
    private readonly calibrationSessionRepository;
    private readonly finalScoreRepository;
    private readonly userRepository;
    private readonly scoreCalculationService;
    constructor(managerEvaluationRepository: IManagerEvaluationRepository, calibrationSessionRepository: ICalibrationSessionRepository, finalScoreRepository: IFinalScoreRepository, userRepository: IUserRepository, scoreCalculationService: ScoreCalculationService);
    execute(input: ApplyCalibrationAdjustmentInput): Promise<ApplyCalibrationAdjustmentOutput>;
}
