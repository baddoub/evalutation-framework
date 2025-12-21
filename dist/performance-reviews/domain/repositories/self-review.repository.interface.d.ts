import { SelfReview } from '../entities/self-review.entity';
import { SelfReviewId } from '../value-objects/self-review-id.vo';
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
export interface ISelfReviewRepository {
    findById(id: SelfReviewId): Promise<SelfReview | null>;
    findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<SelfReview | null>;
    findByCycle(cycleId: ReviewCycleId): Promise<SelfReview[]>;
    save(review: SelfReview): Promise<SelfReview>;
    delete(id: SelfReviewId): Promise<void>;
}
