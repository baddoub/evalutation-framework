import { Injectable, Inject } from '@nestjs/common'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { CreateReviewCycleInput, CreateReviewCycleOutput } from '../../dto/review-cycle.dto'

/**
 * CreateReviewCycleUseCase
 *
 * Orchestrates the creation of a new review cycle:
 * 1. Validate input deadlines are chronological
 * 2. Create ReviewCycle entity
 * 3. Persist to database
 * 4. Return created cycle DTO
 */
@Injectable()
export class CreateReviewCycleUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly reviewCycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: CreateReviewCycleInput): Promise<CreateReviewCycleOutput> {
    // 1. Create CycleDeadlines value object (validates chronological order)
    const deadlines = CycleDeadlines.create({
      selfReview: input.deadlines.selfReview,
      peerFeedback: input.deadlines.peerFeedback,
      managerEvaluation: input.deadlines.managerEvaluation,
      calibration: input.deadlines.calibration,
      feedbackDelivery: input.deadlines.feedbackDelivery,
    })

    // 2. Create ReviewCycle entity
    const cycle = ReviewCycle.create({
      name: input.name,
      year: input.year,
      deadlines,
      startDate: input.startDate,
    })

    // 3. Persist to database
    const savedCycle = await this.reviewCycleRepository.save(cycle)

    // 4. Return DTO
    return {
      id: savedCycle.id.value,
      name: savedCycle.name,
      year: savedCycle.year,
      status: savedCycle.status.value,
      deadlines: savedCycle.deadlines.toObject(),
      startDate: savedCycle.startDate,
      createdAt: new Date(),
    }
  }
}
