import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface';
import { FinalScore, FinalScoreId } from '../../../domain/entities/final-score.entity';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { BonusTier } from '../../../domain/value-objects/bonus-tier.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaFinalScoreRepository implements IFinalScoreRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: FinalScoreId): Promise<FinalScore | null>;
    findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null>;
    findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null>;
    findByCycle(cycleId: ReviewCycleId): Promise<FinalScore[]>;
    findByBonusTier(cycleId: ReviewCycleId, tier: BonusTier): Promise<FinalScore[]>;
    save(score: FinalScore): Promise<FinalScore>;
    delete(id: FinalScoreId): Promise<void>;
}
