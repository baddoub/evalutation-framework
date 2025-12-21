import { ReviewCycle as PrismaReviewCycle } from '@prisma/client';
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity';
export declare class ReviewCycleMapper {
    static toDomain(prisma: PrismaReviewCycle): ReviewCycle;
    static toPrisma(domain: ReviewCycle): Omit<PrismaReviewCycle, 'createdAt' | 'updatedAt' | 'deletedAt'>;
}
