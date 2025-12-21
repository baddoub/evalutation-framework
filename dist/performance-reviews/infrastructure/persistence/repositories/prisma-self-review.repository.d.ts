import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface';
import { SelfReview } from '../../../domain/entities/self-review.entity';
import { SelfReviewId } from '../../../domain/value-objects/self-review-id.vo';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaSelfReviewRepository implements ISelfReviewRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: SelfReviewId): Promise<SelfReview | null>;
    findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<SelfReview | null>;
    findByCycle(cycleId: ReviewCycleId): Promise<SelfReview[]>;
    save(review: SelfReview): Promise<SelfReview>;
    delete(id: SelfReviewId): Promise<void>;
}
