import { PeerFeedback } from '../entities/peer-feedback.entity'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { NoPeerFeedbackException } from '../exceptions/no-peer-feedback.exception'

export interface AnonymizedPeerFeedback {
  averageScores: PillarScores
  feedbackCount: number
  anonymizedComments: {
    strengths: string[]
    growthAreas: string[]
    general: string[]
  }
  // Individual score properties for convenience
  projectImpact: number
  direction: number
  engineeringExcellence: number
  operationalOwnership: number
  peopleImpact: number
  // Flattened comments array
  comments: Array<{ pillar: string; comment: string }>
}

/**
 * PeerFeedbackAggregationService
 *
 * Responsibilities:
 * - Aggregate peer feedback scores
 * - Anonymize peer feedback comments
 * - Calculate average scores
 *
 * SOLID Principles:
 * - SRP: Only responsible for peer feedback aggregation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class PeerFeedbackAggregationService {
  /**
   * Aggregate peer scores (calculate average for each pillar)
   * @param feedbacks - Array of peer feedback
   * @returns Aggregated pillar scores (rounded to nearest integer)
   * @throws NoPeerFeedbackException if feedbacks array is empty
   */
  aggregatePeerScores(feedbacks: PeerFeedback[]): PillarScores {
    if (!feedbacks || feedbacks.length === 0) {
      throw new NoPeerFeedbackException()
    }

    // Calculate sums for each pillar
    const sums = {
      projectImpact: 0,
      direction: 0,
      engineeringExcellence: 0,
      operationalOwnership: 0,
      peopleImpact: 0,
    }

    feedbacks.forEach((feedback) => {
      const scores = feedback.scores
      sums.projectImpact += scores.projectImpact.value
      sums.direction += scores.direction.value
      sums.engineeringExcellence += scores.engineeringExcellence.value
      sums.operationalOwnership += scores.operationalOwnership.value
      sums.peopleImpact += scores.peopleImpact.value
    })

    const count = feedbacks.length

    // Return averaged scores (rounded to nearest integer)
    return PillarScores.create({
      projectImpact: Math.round(sums.projectImpact / count),
      direction: Math.round(sums.direction / count),
      engineeringExcellence: Math.round(sums.engineeringExcellence / count),
      operationalOwnership: Math.round(sums.operationalOwnership / count),
      peopleImpact: Math.round(sums.peopleImpact / count),
    })
  }

  /**
   * Anonymize feedback by removing reviewer identity
   * @param feedbacks - Array of peer feedback
   * @returns Anonymized feedback with aggregated scores and comments
   * @throws NoPeerFeedbackException if feedbacks array is empty
   */
  anonymizeFeedback(feedbacks: PeerFeedback[]): AnonymizedPeerFeedback {
    if (!feedbacks || feedbacks.length === 0) {
      throw new NoPeerFeedbackException()
    }

    const averageScores = this.aggregatePeerScores(feedbacks)

    // Collect all comments (anonymized)
    const strengths: string[] = []
    const growthAreas: string[] = []
    const general: string[] = []

    feedbacks.forEach((feedback) => {
      if (feedback.strengths) {
        strengths.push(feedback.strengths)
      }
      if (feedback.growthAreas) {
        growthAreas.push(feedback.growthAreas)
      }
      if (feedback.generalComments) {
        general.push(feedback.generalComments)
      }
    })

    // Flatten comments into array of { pillar, comment }
    const comments: Array<{ pillar: string; comment: string }> = []
    strengths.forEach((comment) => comments.push({ pillar: 'strengths', comment }))
    growthAreas.forEach((comment) => comments.push({ pillar: 'growthAreas', comment }))
    general.forEach((comment) => comments.push({ pillar: 'general', comment }))

    return {
      averageScores,
      feedbackCount: feedbacks.length,
      anonymizedComments: {
        strengths,
        growthAreas,
        general,
      },
      // Individual score properties
      projectImpact: averageScores.projectImpact.value,
      direction: averageScores.direction.value,
      engineeringExcellence: averageScores.engineeringExcellence.value,
      operationalOwnership: averageScores.operationalOwnership.value,
      peopleImpact: averageScores.peopleImpact.value,
      // Flattened comments
      comments,
    }
  }

  /**
   * Alias for anonymizeFeedback() - Aggregate feedback
   * @param feedbacks - Array of peer feedback
   * @returns Anonymized feedback with aggregated scores and comments
   * @throws NoPeerFeedbackException if feedbacks array is empty
   */
  aggregateFeedback(feedbacks: PeerFeedback[]): AnonymizedPeerFeedback {
    return this.anonymizeFeedback(feedbacks)
  }
}
