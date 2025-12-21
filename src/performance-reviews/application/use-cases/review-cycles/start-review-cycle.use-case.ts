import { Injectable, Inject } from '@nestjs/common'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { StartReviewCycleInput, StartReviewCycleOutput } from '../../dto/review-cycle.dto'

/**
 * StartReviewCycleUseCase
 *
 * Orchestrates starting a review cycle:
 * 1. Find cycle by ID
 * 2. Validate no other active cycle exists
 * 3. Start the cycle (DRAFT → ACTIVE)
 * 4. Persist changes
 * 5. Return output DTO
 */
@Injectable()
export class StartReviewCycleUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly reviewCycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: StartReviewCycleInput): Promise<StartReviewCycleOutput> {
    // 1. Find cycle by ID
    const cycleId = ReviewCycleId.fromString(input.cycleId)
    const cycle = await this.reviewCycleRepository.findById(cycleId)

    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId} not found`)
    }

    // 2. Validate no other active cycle exists
    const activeCycle = await this.reviewCycleRepository.findActive()
    if (activeCycle && !activeCycle.id.equals(cycleId)) {
      throw new Error('Another review cycle is already active. Please complete it first.')
    }

    // 3. Start the cycle (domain logic handles state transition validation)
    cycle.start()

    // 4. Persist changes
    const updatedCycle = await this.reviewCycleRepository.save(cycle)

    // 5. Return output DTO
    return {
      id: updatedCycle.id.value,
      status: updatedCycle.status.value,
      startedAt: updatedCycle.startDate,
    }
  }
}
