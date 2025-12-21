import { PeerFeedback } from '../entities/peer-feedback.entity'
import { PeerFeedbackId } from '../value-objects/peer-feedback-id.vo'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'

/**
 * IPeerFeedbackRepository Interface
 *
 * Repository contract for PeerFeedback aggregate
 * Domain layer defines the interface, infrastructure implements it
 */
export interface IPeerFeedbackRepository {
  findById(id: PeerFeedbackId): Promise<PeerFeedback | null>
  findByRevieweeAndCycle(revieweeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>
  findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>
  findByReviewerAndCycle(reviewerId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]>
  save(feedback: PeerFeedback): Promise<PeerFeedback>
  delete(id: PeerFeedbackId): Promise<void>
}
