import { Injectable, Inject } from '@nestjs/common'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

export interface AggregatedPeerFeedbackOutput {
  employeeId: string
  cycleId: string
  aggregatedScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  feedbackCount: number
  anonymizedComments: Array<{
    pillar: string
    comment: string
  }>
}

@Injectable()
export class GetAggregatedPeerFeedbackUseCase {
  constructor(
    @Inject('IPeerFeedbackRepository')
    private readonly peerFeedbackRepository: IPeerFeedbackRepository,
    private readonly aggregationService: PeerFeedbackAggregationService,
  ) {}

  async execute(employeeId: string, cycleId: string): Promise<AggregatedPeerFeedbackOutput> {
    const feedbackList = await this.peerFeedbackRepository.findByEmployeeAndCycle(
      UserId.fromString(employeeId),
      ReviewCycleId.create(cycleId),
    )

    const aggregated = this.aggregationService.aggregateFeedback(feedbackList)

    return {
      employeeId,
      cycleId,
      aggregatedScores: {
        projectImpact: aggregated.projectImpact,
        direction: aggregated.direction,
        engineeringExcellence: aggregated.engineeringExcellence,
        operationalOwnership: aggregated.operationalOwnership,
        peopleImpact: aggregated.peopleImpact,
      },
      feedbackCount: feedbackList.length,
      anonymizedComments: aggregated.comments,
    }
  }
}
