import { Injectable, Inject } from '@nestjs/common'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { GetPeerFeedbackInput, GetPeerFeedbackOutput } from '../../dto/peer-feedback.dto'

/**
 * GetPeerFeedbackUseCase
 *
 * Retrieves aggregated peer feedback for a reviewee:
 * 1. Validate cycle exists
 * 2. Find all peer feedback for reviewee in cycle
 * 3. Use PeerFeedbackAggregationService to aggregate scores
 * 4. Return anonymized peer feedback DTO
 */
@Injectable()
export class GetPeerFeedbackUseCase {
  constructor(
    @Inject('IPeerFeedbackRepository')
    private readonly peerFeedbackRepository: IPeerFeedbackRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    private readonly aggregationService: PeerFeedbackAggregationService,
  ) {}

  async execute(input: GetPeerFeedbackInput): Promise<GetPeerFeedbackOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Find all peer feedback for reviewee
    const feedbacks = await this.peerFeedbackRepository.findByRevieweeAndCycle(
      input.revieweeId,
      input.cycleId,
    )

    if (feedbacks.length === 0) {
      // Return empty result if no peer feedback yet
      return {
        aggregatedScores: {
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        },
        feedbackCount: 0,
        anonymizedComments: [],
      }
    }

    // 3. Aggregate feedback using domain service
    const anonymizedFeedback = this.aggregationService.anonymizeFeedback(feedbacks)

    // 4. Return DTO
    const avgScores = anonymizedFeedback.averageScores.toObject()

    const anonymizedComments: Array<{
      strengths?: string
      growthAreas?: string
      generalComments?: string
    }> = []

    // Combine comments from all feedbacks (anonymized)
    feedbacks.forEach((feedback) => {
      const comment: {
        strengths?: string
        growthAreas?: string
        generalComments?: string
      } = {}

      if (feedback.strengths) {
        comment.strengths = feedback.strengths
      }
      if (feedback.growthAreas) {
        comment.growthAreas = feedback.growthAreas
      }
      if (feedback.generalComments) {
        comment.generalComments = feedback.generalComments
      }

      if (Object.keys(comment).length > 0) {
        anonymizedComments.push(comment)
      }
    })

    return {
      aggregatedScores: {
        projectImpact: avgScores.projectImpact,
        direction: avgScores.direction,
        engineeringExcellence: avgScores.engineeringExcellence,
        operationalOwnership: avgScores.operationalOwnership,
        peopleImpact: avgScores.peopleImpact,
      },
      feedbackCount: anonymizedFeedback.feedbackCount,
      anonymizedComments,
    }
  }
}
