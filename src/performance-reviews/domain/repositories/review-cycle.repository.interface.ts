import { ReviewCycle } from '../entities/review-cycle.entity'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'

/**
 * IReviewCycleRepository Interface
 *
 * Repository contract for ReviewCycle aggregate
 * Domain layer defines the interface, infrastructure implements it
 */
export interface IReviewCycleRepository {
  findById(id: ReviewCycleId): Promise<ReviewCycle | null>
  findByYear(year: number): Promise<ReviewCycle[]>
  findActive(): Promise<ReviewCycle | null>
  save(cycle: ReviewCycle): Promise<ReviewCycle>
  delete(id: ReviewCycleId): Promise<void>
}
