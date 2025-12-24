import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { FinalScoreId } from '../../../domain/value-objects/final-score-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

export interface DeliverFeedbackInput {
  finalScoreId: string
  deliveredBy: string
  feedbackNotes?: string
}

export interface DeliverFeedbackOutput {
  id: string
  employeeId: string
  cycleId: string
  feedbackDelivered: boolean
  feedbackNotes?: string
  deliveredAt: Date
  deliveredBy: string
  weightedScore: number
  percentageScore: number
  bonusTier: string
}

@Injectable()
export class DeliverFeedbackUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
  ) {}

  async execute(input: DeliverFeedbackInput): Promise<DeliverFeedbackOutput> {
    const finalScore = await this.finalScoreRepository.findById(
      FinalScoreId.fromString(input.finalScoreId),
    )

    if (!finalScore) {
      throw new Error('Final score not found')
    }

    if (finalScore.isLocked) {
      throw new Error('Cannot deliver feedback on a locked final score')
    }

    finalScore.markFeedbackDelivered(UserId.fromString(input.deliveredBy), input.feedbackNotes)
    const savedFinalScore = await this.finalScoreRepository.save(finalScore)

    return {
      id: savedFinalScore.id.value,
      employeeId: savedFinalScore.employeeId.value,
      cycleId: savedFinalScore.cycleId.value,
      feedbackDelivered: savedFinalScore.feedbackDelivered,
      feedbackNotes: savedFinalScore.feedbackNotes,
      deliveredAt: savedFinalScore.deliveredAt!,
      deliveredBy: input.deliveredBy,
      weightedScore: savedFinalScore.weightedScore.value,
      percentageScore: savedFinalScore.percentageScore || 0,
      bonusTier: savedFinalScore.bonusTier.value,
    }
  }
}
