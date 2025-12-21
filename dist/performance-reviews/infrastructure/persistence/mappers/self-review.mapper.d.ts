import { SelfReview as PrismaSelfReview } from '@prisma/client';
import { SelfReview } from '../../../domain/entities/self-review.entity';
export declare class SelfReviewMapper {
    static toDomain(prisma: PrismaSelfReview): SelfReview;
    static toPrisma(domain: SelfReview): Omit<PrismaSelfReview, 'createdAt' | 'updatedAt' | 'deletedAt'>;
}
