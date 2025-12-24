/**
 * Self Review DTOs
 */

import type { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import type { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import type { Narrative } from '../../domain/value-objects/narrative.vo'

export interface SelfReviewDto {
  id: string
  cycleId: string
  userId: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  narrative: string
  wordCount: number
  status: string
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface GetMySelfReviewInput {
  userId: UserId
  cycleId: ReviewCycleId
}

export interface GetMySelfReviewOutput {
  id: string
  cycleId: string
  userId: string
  status: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  narrative: string
  wordCount: number
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UpdateSelfReviewInput {
  userId: UserId
  cycleId: ReviewCycleId
  scores?: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  narrative?: Narrative
}

export interface UpdateSelfReviewOutput {
  id: string
  userId: string
  cycleId: string
  status: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  narrative: string
  wordCount: number
  submittedAt?: Date
  updatedAt: Date
}

export interface SubmitSelfReviewInput {
  userId: UserId
  cycleId: ReviewCycleId
}

export interface SubmitSelfReviewOutput {
  id: string
  status: string
  submittedAt: Date
}
