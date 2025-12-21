import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaReviewCycleRepository implements IReviewCycleRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: ReviewCycleId): Promise<ReviewCycle | null>;
    findByYear(year: number): Promise<ReviewCycle[]>;
    findActive(): Promise<ReviewCycle | null>;
    save(cycle: ReviewCycle): Promise<ReviewCycle>;
    delete(id: ReviewCycleId): Promise<void>;
}
