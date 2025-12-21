import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

export interface GetFinalScoreOutput {
  id: string
  employeeId: string
  cycleId: string
  finalScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  weightedScore: number
  percentageScore: number
  bonusTier: string
  finalLevel: string
  calculatedAt: Date
  feedbackDelivered: boolean
  feedbackNotes?: string
  deliveredAt?: Date
  deliveredBy?: string
}

@Injectable()
export class GetFinalScoreUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
  ) {}

  async execute(
    employeeId: string,
    cycleId: string,
  ): Promise<GetFinalScoreOutput | null> {
    const finalScore = await this.finalScoreRepository.findByEmployeeAndCycle(
      UserId.fromString(employeeId),
      ReviewCycleId.create(cycleId),
    )

    if (!finalScore) {
      return null
    }

    return {
      id: finalScore.id.value,
      employeeId: finalScore.employeeId.value,
      cycleId: finalScore.cycleId.value,
      finalScores: {
        projectImpact: finalScore.finalScores.projectImpact.value,
        direction: finalScore.finalScores.direction.value,
        engineeringExcellence: finalScore.finalScores.engineeringExcellence.value,
        operationalOwnership: finalScore.finalScores.operationalOwnership.value,
        peopleImpact: finalScore.finalScores.peopleImpact.value,
      },
      weightedScore: finalScore.weightedScore.value,
      percentageScore: finalScore.percentageScore || 0,
      bonusTier: finalScore.bonusTier.value,
      finalLevel: finalScore.finalLevel.value,
      calculatedAt: finalScore.calculatedAt,
      feedbackDelivered: finalScore.feedbackDelivered,
      feedbackNotes: finalScore.feedbackNotes,
      deliveredAt: finalScore.deliveredAt,
      deliveredBy: finalScore.deliveredBy?.value,
    }
  }
}
