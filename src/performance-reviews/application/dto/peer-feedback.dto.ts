/**
 * Peer Feedback DTOs
 */

import type { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import type { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'

export interface PeerFeedbackDto {
  id: string
  cycleId: string
  revieweeId: string
  reviewerId: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  strengths?: string
  growthAreas?: string
  generalComments?: string
  submittedAt: Date
  isAnonymized: boolean
}

export interface NominatePeersInput {
  nominatorId: UserId
  cycleId: ReviewCycleId
  nomineeIds: UserId[]
}

export interface NominatePeersOutput {
  nominations: Array<{
    id: string
    nomineeId: string
    nomineeName: string
    status: string
    nominatedAt: Date
  }>
}

export interface SubmitPeerFeedbackInput {
  reviewerId: UserId
  revieweeId: UserId
  cycleId: ReviewCycleId
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  strengths?: string
  growthAreas?: string
  generalComments?: string
}

export interface SubmitPeerFeedbackOutput {
  id: string
  revieweeId: string
  submittedAt: Date
  isAnonymized: boolean
}

export interface GetPeerFeedbackInput {
  revieweeId: UserId
  cycleId: ReviewCycleId
}

export interface GetPeerFeedbackOutput {
  aggregatedScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  feedbackCount: number
  anonymizedComments: Array<{
    strengths?: string
    growthAreas?: string
    generalComments?: string
  }>
}
