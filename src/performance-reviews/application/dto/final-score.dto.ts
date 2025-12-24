/**
 * Final Score DTOs
 */

import type { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import type { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'

export interface FinalScoreDto {
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
  weightedScore: number
  percentageScore: number
  bonusTier: string
  peerFeedbackSummary?: {
    averageScores: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    }
    count: number
  }
  locked: boolean
  lockedAt?: Date
  feedbackDelivered: boolean
  feedbackDeliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface GetMyFinalScoreInput {
  userId: UserId
  cycleId: ReviewCycleId
}

export interface GetMyFinalScoreOutput {
  employee: {
    id: string
    name: string
    level: string
  }
  cycle: {
    id: string
    name: string
    year: number
  }
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  peerFeedbackSummary?: {
    averageScores: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    }
    count: number
  }
  weightedScore: number
  percentageScore: number
  bonusTier: string
  isLocked: boolean
  feedbackDelivered: boolean
  feedbackDeliveredAt?: Date
}

export interface GetTeamFinalScoresInput {
  managerId: UserId
  cycleId: ReviewCycleId
}

export interface GetTeamFinalScoresOutput {
  teamScores: Array<{
    employeeId: string
    employeeName: string
    level: string
    weightedScore: number
    percentageScore: number
    bonusTier: string
    feedbackDelivered: boolean
  }>
}

export interface MarkFeedbackDeliveredInput {
  employeeId: UserId
  managerId: UserId
  cycleId: ReviewCycleId
  feedbackNotes?: string
}

export interface MarkFeedbackDeliveredOutput {
  employeeId: string
  feedbackDelivered: boolean
  feedbackDeliveredAt: Date
}

// Calibration DTOs
export interface GetCalibrationDashboardInput {
  cycleId: ReviewCycleId
  department?: string
}

export interface GetCalibrationDashboardOutput {
  summary: {
    totalEvaluations: number
    byBonusTier: {
      EXCEEDS: number
      MEETS: number
      BELOW: number
    }
    byDepartment: Record<
      string,
      {
        EXCEEDS: number
        MEETS: number
        BELOW: number
      }
    >
  }
  evaluations: Array<{
    employeeId: string
    employeeName: string
    level: string
    department: string
    managerId: string
    managerName: string
    scores: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    }
    weightedScore: number
    percentageScore: number
    bonusTier: string
    calibrationStatus: string
  }>
}

export interface CreateCalibrationSessionInput {
  cycleId: ReviewCycleId
  name: string
  facilitatorId: UserId
  participantIds: UserId[]
  scheduledAt: Date
  department?: string
}

export interface CreateCalibrationSessionOutput {
  id: string
  name: string
  status: string
  scheduledAt: Date
  participantCount: number
}

export interface ApplyCalibrationAdjustmentInput {
  sessionId: string
  evaluationId: string
  adjustedScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  justification: string
}

export interface ApplyCalibrationAdjustmentOutput {
  id: string
  adjustmentId: string
  evaluationId: string
  originalScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  adjustedScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  oldWeightedScore: number
  newWeightedScore: number
  oldBonusTier: string
  newBonusTier: string
  adjustedAt: Date
}

export interface LockFinalScoresInput {
  cycleId: ReviewCycleId
}

export interface LockFinalScoresOutput {
  cycleId: string
  totalScoresLocked: number
  lockedAt: Date
}

// Score Adjustment DTOs
export interface RequestScoreAdjustmentInput {
  employeeId: UserId
  managerId: UserId
  cycleId: ReviewCycleId
  proposedScores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  reason: string
}

export interface RequestScoreAdjustmentOutput {
  id: string
  employeeId: string
  status: string
  reason: string
  requestedAt: Date
}

export interface ReviewScoreAdjustmentInput {
  requestId: string
  approverId: UserId
  action: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
}

export interface ReviewScoreAdjustmentOutput {
  id: string
  status: string
  reviewedAt: Date
  approvedBy: string
}
