import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'

export interface PeerNomination {
  id: string
  cycleId: ReviewCycleId
  nominatorId: UserId
  nomineeId: UserId
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'OVERRIDDEN_BY_MANAGER'
  declineReason?: string
  nominatedAt: Date
  respondedAt?: Date
}

/**
 * IPeerNominationRepository Interface
 *
 * Repository contract for PeerNomination
 * Domain layer defines the interface, infrastructure implements it
 */
export interface IPeerNominationRepository {
  findById(id: string): Promise<PeerNomination | null>
  findByNominatorAndCycle(nominatorId: UserId, cycleId: ReviewCycleId): Promise<PeerNomination[]>
  findByNomineeAndCycle(nomineeId: UserId, cycleId: ReviewCycleId): Promise<PeerNomination[]>
  save(nomination: PeerNomination): Promise<PeerNomination>
  delete(id: string): Promise<void>
}
