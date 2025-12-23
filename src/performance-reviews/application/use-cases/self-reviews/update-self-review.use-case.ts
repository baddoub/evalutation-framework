import { Injectable, Inject } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { UpdateSelfReviewInput, UpdateSelfReviewOutput } from '../../dto/self-review.dto'

/**
 * UpdateSelfReviewUseCase
 *
 * Updates a self-review with new scores and narrative:
 * 1. Validate cycle exists and deadline not passed
 * 2. Find self-review
 * 3. Update scores and narrative (validates word count)
 * 4. Persist changes
 * 5. Return updated review DTO
 */
@Injectable()
export class UpdateSelfReviewUseCase {
  constructor(
    @Inject('ISelfReviewRepository')
    private readonly selfReviewRepository: ISelfReviewRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: UpdateSelfReviewInput): Promise<UpdateSelfReviewOutput> {
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
      throw new ReviewNotFoundException(
        `Self-review not found for user ${input.userId.value} in cycle ${input.cycleId.value}`,
      )
    }

    // 4. Update scores if provided
    if (input.scores) {
      const scores = PillarScores.create(input.scores)
      review.updateScores(scores)
    }

    // 5. Update narrative if provided
    if (input.narrative) {
      review.updateNarrative(input.narrative)
    }

    // 6. Persist changes
    const updatedReview = await this.selfReviewRepository.save(review)

    // 7. Return DTO
    const updatedScores = updatedReview.scores.toObject()
    return {
      id: updatedReview.id.value,
      userId: updatedReview.userId.value,
      cycleId: updatedReview.cycleId.value,
      status: updatedReview.status.value,
      scores: {
        projectImpact: updatedScores.projectImpact,
        direction: updatedScores.direction,
        engineeringExcellence: updatedScores.engineeringExcellence,
        operationalOwnership: updatedScores.operationalOwnership,
        peopleImpact: updatedScores.peopleImpact,
      },
      narrative: updatedReview.narrative.text,
      wordCount: updatedReview.narrative.wordCount,
      submittedAt: updatedReview.submittedAt,
      updatedAt: new Date(),
    }
  }
}
