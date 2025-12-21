import { Injectable, Inject } from '@nestjs/common'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { GetActiveCycleOutput } from '../../dto/review-cycle.dto'

/**
 * GetActiveCycleUseCase
 *
 * Retrieves the currently active review cycle:
 * 1. Query findActive() from repository
 * 2. Return active cycle DTO or null
 */
@Injectable()
export class GetActiveCycleUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly reviewCycleRepository: IReviewCycleRepository,
  ) {}

  async execute(): Promise<GetActiveCycleOutput | null> {
    // 1. Query for active cycle
    const cycle = await this.reviewCycleRepository.findActive()

    if (!cycle) {
      return null
    }

    // 2. Return DTO
    return {
      id: cycle.id.value,
      name: cycle.name,
      year: cycle.year,
      status: cycle.status.value,
      deadlines: cycle.deadlines.toObject(),
      startDate: cycle.startDate,
    }
  }
}
