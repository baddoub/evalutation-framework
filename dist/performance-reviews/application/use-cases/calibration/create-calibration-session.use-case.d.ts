import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { CreateCalibrationSessionInput, CreateCalibrationSessionOutput } from '../../dto/final-score.dto';
export declare class CreateCalibrationSessionUseCase {
    private readonly calibrationSessionRepository;
    private readonly cycleRepository;
    constructor(calibrationSessionRepository: ICalibrationSessionRepository, cycleRepository: IReviewCycleRepository);
    execute(input: CreateCalibrationSessionInput): Promise<CreateCalibrationSessionOutput>;
}
