import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { GetMyFinalScoreInput, GetMyFinalScoreOutput } from '../../dto/final-score.dto'

@Injectable()
export class GetMyFinalScoreUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetMyFinalScoreInput): Promise<GetMyFinalScoreOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Get user
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new ReviewNotFoundException('User not found')
    }

    // 3. Get final score
    const finalScore = await this.finalScoreRepository.findByUserAndCycle(
      input.userId,
      input.cycleId,
    )
    if (!finalScore) {
      throw new ReviewNotFoundException('Final score not found for this user and cycle')
    }

    // 4. Build response
    const scores = finalScore.pillarScores.toObject()

    let peerFeedbackSummary = undefined
    if (finalScore.peerAverageScores && finalScore.peerFeedbackCount > 0) {
      const peerScores = finalScore.peerAverageScores.toObject()
      peerFeedbackSummary = {
        averageScores: peerScores,
        count: finalScore.peerFeedbackCount,
      }
    }

    return {
      employee: {
        id: user.id.value,
        name: user.name,
        level: user.level || 'Unknown',
      },
      cycle: {
        id: cycle.id.value,
        name: cycle.name,
        year: cycle.year,
      },
      scores,
      peerFeedbackSummary,
      weightedScore: finalScore.weightedScore.value,
      percentageScore: finalScore.percentageScore,
      bonusTier: finalScore.bonusTier.value,
      isLocked: finalScore.isLocked,
      feedbackDelivered: finalScore.feedbackDelivered,
      feedbackDeliveredAt: finalScore.feedbackDeliveredAt,
    }
  }
}
