import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface';
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity';
import { PeerFeedbackId } from '../../../domain/value-objects/peer-feedback-id.vo';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaPeerFeedbackRepository implements IPeerFeedbackRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: PeerFeedbackId): Promise<PeerFeedback | null>;
    findByRevieweeAndCycle(revieweeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>;
    findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>;
    findByReviewerAndCycle(reviewerId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>;
    save(feedback: PeerFeedback): Promise<PeerFeedback>;
    delete(id: PeerFeedbackId): Promise<void>;
}
