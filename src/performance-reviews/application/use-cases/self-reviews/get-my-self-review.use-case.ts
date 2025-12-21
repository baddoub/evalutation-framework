import { Injectable, Inject } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { SelfReview } from '../../../domain/entities/self-review.entity'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../domain/value-objects/narrative.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { GetMySelfReviewInput, GetMySelfReviewOutput } from '../../dto/self-review.dto'

/**
 * GetMySelfReviewUseCase
 *
 * Retrieves or creates a draft self-review for the user:
 * 1. Validate cycle exists
 * 2. Find existing self-review or create a new draft
 * 3. Return self-review DTO
 */
@Injectable()
export class GetMySelfReviewUseCase {
  constructor(
    @Inject('ISelfReviewRepository')
    private readonly selfReviewRepository: ISelfReviewRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: GetMySelfReviewInput): Promise<GetMySelfReviewOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Find or create self-review
    let review = await this.selfReviewRepository.findByUserAndCycle(input.userId, input.cycleId)

    if (!review) {
      // Create a new draft review with default values
      review = SelfReview.create({
        cycleId: input.cycleId,
        userId: input.userId,
        scores: PillarScores.create({
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        }),
        narrative: Narrative.fromText(''),
      })

      review = await this.selfReviewRepository.save(review)
    }

    // 3. Return DTO
    const scores = review.scores.toObject()
    return {
      id: review.id.value,
      cycleId: review.cycleId.value,
      userId: review.userId.value,
      status: review.status.value,
      scores: {
        projectImpact: scores.projectImpact,
        direction: scores.direction,
        engineeringExcellence: scores.engineeringExcellence,
        operationalOwnership: scores.operationalOwnership,
        peopleImpact: scores.peopleImpact,
      },
      narrative: review.narrative.text,
      wordCount: review.narrative.wordCount,
      submittedAt: review.submittedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}
