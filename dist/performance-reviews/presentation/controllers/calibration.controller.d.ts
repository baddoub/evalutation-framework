import { CurrentUserData } from '../decorators/current-user.decorator';
import { RecordCalibrationNoteRequestDto, ApplyCalibrationAdjustmentRequestDto, CalibrationSessionResponseDto } from '../dto/calibration.dto';
import { GetCalibrationSessionUseCase } from '../../application/use-cases/calibration/get-calibration-session.use-case';
import { RecordCalibrationNoteUseCase } from '../../application/use-cases/calibration/record-calibration-note.use-case';
import { ApplyCalibrationAdjustmentUseCase } from '../../application/use-cases/calibration/apply-calibration-adjustment.use-case';
import { LockCalibrationUseCase } from '../../application/use-cases/calibration/lock-calibration.use-case';
export declare class CalibrationController {
    private readonly getCalibrationSessionUseCase;
    private readonly recordCalibrationNoteUseCase;
    private readonly applyCalibrationAdjustmentUseCase;
    private readonly lockCalibrationUseCase;
    constructor(getCalibrationSessionUseCase: GetCalibrationSessionUseCase, recordCalibrationNoteUseCase: RecordCalibrationNoteUseCase, applyCalibrationAdjustmentUseCase: ApplyCalibrationAdjustmentUseCase, lockCalibrationUseCase: LockCalibrationUseCase);
    getCalibrationSession(sessionId: string): Promise<CalibrationSessionResponseDto>;
    recordCalibrationNote(sessionId: string, user: CurrentUserData, dto: RecordCalibrationNoteRequestDto): Promise<CalibrationSessionResponseDto>;
    applyCalibrationAdjustment(sessionId: string, evaluationId: string, dto: ApplyCalibrationAdjustmentRequestDto): Promise<{
        id: string;
        message: string;
    }>;
    lockCalibration(sessionId: string, user: CurrentUserData): Promise<CalibrationSessionResponseDto>;
}
