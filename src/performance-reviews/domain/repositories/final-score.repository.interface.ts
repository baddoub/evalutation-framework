import { FinalScore, FinalScoreId } from '../entities/final-score.entity'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { BonusTier } from '../value-objects/bonus-tier.vo'

/**
 * IFinalScoreRepository Interface
 *
 * Repository contract for FinalScore aggregate
 * Domain layer defines the interface, infrastructure implements it
 */
export interface IFinalScoreRepository {
  findById(id: FinalScoreId): Promise<FinalScore | null>
  findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null>
  findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null>
  findByCycle(cycleId: ReviewCycleId): Promise<FinalScore[]>
  findByBonusTier(cycleId: ReviewCycleId, tier: BonusTier): Promise<FinalScore[]>
  save(score: FinalScore): Promise<FinalScore>
  delete(id: FinalScoreId): Promise<void>
}
