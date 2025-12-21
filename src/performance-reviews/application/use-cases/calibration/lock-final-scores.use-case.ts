import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { LockFinalScoresInput, LockFinalScoresOutput } from '../../dto/final-score.dto'

@Injectable()
export class LockFinalScoresUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: LockFinalScoresInput): Promise<LockFinalScoresOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Get all final scores for cycle
    const finalScores = await this.finalScoreRepository.findByCycle(input.cycleId)

    // 3. Lock each final score
    const lockedAt = new Date()
    const lockPromises = finalScores.map(async (score) => {
      if (!score.isLocked) {
        score.lock()
        return this.finalScoreRepository.save(score)
      }
      return score
    })

    const lockedScores = await Promise.all(lockPromises)

    // 4. Return DTO
    return {
      cycleId: input.cycleId.value,
      totalScoresLocked: lockedScores.length,
      lockedAt,
    }
  }
}
