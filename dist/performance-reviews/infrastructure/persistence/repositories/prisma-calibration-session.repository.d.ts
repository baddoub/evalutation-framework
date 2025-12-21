import { ICalibrationSessionRepository, CalibrationSession } from '../../../domain/repositories/calibration-session.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaCalibrationSessionRepository implements ICalibrationSessionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<CalibrationSession | null>;
    findByCycle(cycleId: ReviewCycleId): Promise<CalibrationSession[]>;
    findByDepartment(cycleId: ReviewCycleId, department: string): Promise<CalibrationSession[]>;
    save(session: CalibrationSession): Promise<CalibrationSession>;
    delete(id: string): Promise<void>;
    private toDomain;
}
