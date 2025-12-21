import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
export interface CalibrationSession {
    id: string;
    cycleId: ReviewCycleId;
    name: string;
    department?: string;
    facilitatorId: UserId;
    participantIds: string[];
    scheduledAt: Date;
    completedAt?: Date;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    notes?: string;
}
export interface ICalibrationSessionRepository {
    findById(id: string): Promise<CalibrationSession | null>;
    findByCycle(cycleId: ReviewCycleId): Promise<CalibrationSession[]>;
    findByDepartment(cycleId: ReviewCycleId, department: string): Promise<CalibrationSession[]>;
    save(session: CalibrationSession): Promise<CalibrationSession>;
    delete(id: string): Promise<void>;
}
