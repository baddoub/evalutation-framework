import { IScoreAdjustmentRequestRepository, ScoreAdjustmentRequest } from '../../../domain/repositories/score-adjustment-request.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaScoreAdjustmentRequestRepository implements IScoreAdjustmentRequestRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<ScoreAdjustmentRequest | null>;
    findPending(): Promise<ScoreAdjustmentRequest[]>;
    findByEmployee(employeeId: UserId, cycleId: ReviewCycleId): Promise<ScoreAdjustmentRequest[]>;
    save(request: ScoreAdjustmentRequest): Promise<ScoreAdjustmentRequest>;
    delete(id: string): Promise<void>;
    private toDomain;
}
