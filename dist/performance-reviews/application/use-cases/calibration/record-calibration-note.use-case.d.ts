import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { GetCalibrationSessionOutput } from './get-calibration-session.use-case';
export interface RecordCalibrationNoteInput {
    sessionId: CalibrationSessionId;
    notes: string;
    recordedBy: UserId;
}
export declare class RecordCalibrationNoteUseCase {
    private readonly calibrationSessionRepository;
    constructor(calibrationSessionRepository: ICalibrationSessionRepository);
    execute(input: RecordCalibrationNoteInput): Promise<GetCalibrationSessionOutput>;
}
