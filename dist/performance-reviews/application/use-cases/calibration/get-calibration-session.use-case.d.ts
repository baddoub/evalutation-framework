import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo';
export interface GetCalibrationSessionOutput {
    id: string;
    cycleId: string;
    department: string;
    status: string;
    notes: string;
    lockedAt?: Date;
    lockedBy?: string;
    participants: Array<{
        userId: string;
        userName: string;
        role: string;
    }>;
    evaluations: Array<{
        evaluationId: string;
        employeeId: string;
        employeeName: string;
        currentLevel: string;
        proposedLevel: string;
        scores: {
            projectImpact: number;
            direction: number;
            engineeringExcellence: number;
            operationalOwnership: number;
            peopleImpact: number;
        };
    }>;
    createdAt: Date;
}
export declare class GetCalibrationSessionUseCase {
    private readonly calibrationSessionRepository;
    constructor(calibrationSessionRepository: ICalibrationSessionRepository);
    execute(sessionId: CalibrationSessionId): Promise<GetCalibrationSessionOutput | null>;
}
