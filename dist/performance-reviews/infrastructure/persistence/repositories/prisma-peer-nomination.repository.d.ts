import { IPeerNominationRepository, PeerNomination } from '../../../domain/repositories/peer-nomination.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaPeerNominationRepository implements IPeerNominationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<PeerNomination | null>;
    findByNominatorAndCycle(nominatorId: UserId, cycleId: ReviewCycleId): Promise<PeerNomination[]>;
    findByNomineeAndCycle(nomineeId: UserId, cycleId: ReviewCycleId): Promise<PeerNomination[]>;
    save(nomination: PeerNomination): Promise<PeerNomination>;
    delete(id: string): Promise<void>;
    private toDomain;
}
