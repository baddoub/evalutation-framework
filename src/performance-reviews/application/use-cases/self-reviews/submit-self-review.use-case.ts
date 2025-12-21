import { Injectable, Inject } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { SubmitSelfReviewInput, SubmitSelfReviewOutput } from '../../dto/self-review.dto'

/**
 * SubmitSelfReviewUseCase
 *
 * Submits a self-review:
 * 1. Validate cycle exists and deadline not passed
 * 2. Find self-review
 * 3. Validate review is complete
 * 4. Submit review (DRAFT → SUBMITTED)
 * 5. Persist changes
 * 6. Return submitted review DTO
 */
@Injectable()
export class SubmitSelfReviewUseCase {
  constructor(
    @Inject('ISelfReviewRepository')
    private readonly selfReviewRepository: ISelfReviewRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: SubmitSelfReviewInput): Promise<SubmitSelfReviewOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Check deadline
    if (cycle.hasDeadlinePassed('selfReview')) {
      throw new Error('Self-review deadline has passed')
    }

    // 3. Find self-review
    const review = await this.selfReviewRepository.findByUserAndCycle(input.userId, input.cycleId)
    if (!review) {
      throw new ReviewNotFoundException('Self-review not found for this user and cycle')
    }

    // 4. Validate review is complete (has narrative)
    if (review.narrative.text.trim() === '') {
      throw new Error('Cannot submit incomplete self-review. Narrative is required.')
    }

    // 5. Submit review (domain entity handles state transition)
    review.submit()

    // 6. Persist changes
    const submittedReview = await this.selfReviewRepository.save(review)

    // 7. Return DTO
    return {
      id: submittedReview.id.value,
      status: submittedReview.status.value,
      submittedAt: submittedReview.submittedAt!,
    }
  }
}
