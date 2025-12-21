import { PeerFeedback as PrismaPeerFeedback } from '@prisma/client';
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity';
export declare class PeerFeedbackMapper {
    static toDomain(prisma: PrismaPeerFeedback): PeerFeedback;
    static toPrisma(domain: PeerFeedback): Omit<PrismaPeerFeedback, 'createdAt' | 'updatedAt' | 'deletedAt'>;
}
