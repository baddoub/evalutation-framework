export enum ReviewStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CALIBRATION = 'CALIBRATION',
  COMPLETED = 'COMPLETED',
}

export enum SelfReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export enum BonusTier {
  EXCEEDS = 'EXCEEDS',
  MEETS = 'MEETS',
  BELOW = 'BELOW',
}

export enum NominationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export interface PillarScores {
  projectImpact: number
  direction: number
  engineeringExcellence: number
  operationalOwnership: number
  peopleImpact: number
}

export interface ReviewCycleDeadlines {
  selfReview: string
  peerFeedback: string
  managerEval: string
  calibration: string
  feedbackDelivery: string
}

export interface ReviewCycle {
  id: string
  name: string
  year: number
  status: ReviewStatus
  deadlines: ReviewCycleDeadlines
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface SelfReview {
  id: string
  cycleId: string
  status: SelfReviewStatus
  scores: PillarScores
  narrative: string
  wordCount: number
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PeerNomination {
  id: string
  nomineeId: string
  nomineeName: string
  status: NominationStatus
  nominatedAt: string
}

export interface PeerFeedback {
  id: string
  revieweeId: string
  scores: PillarScores
  strengths: string
  growthAreas: string
  generalComments: string
  submittedAt: string
  isAnonymized: boolean
}

export interface AggregatedPeerFeedback {
  aggregatedScores: PillarScores
  feedbackCount: number
  anonymizedComments: Array<{
    pillar: string
    comment: string
  }>
}

export interface PeerFeedbackRequest {
  id: string
  revieweeId: string
  revieweeName: string
  revieweeEmail: string
  status: string
  dueDate: string
}

export interface ManagerEvaluation {
  id: string
  employeeId: string
  cycleId: string
  scores: PillarScores
  strengths: string
  growthAreas: string
  promotionReadiness: string
  overallAssessment: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeReview {
  employeeId: string
  employeeName: string
  employeeEmail: string
  selfReview: SelfReview
  peerFeedback: AggregatedPeerFeedback
  managerEvaluation?: ManagerEvaluation
  finalScore?: FinalScore
}

export interface TeamReview {
  employeeId: string
  employeeName: string
  employeeEmail: string
  selfReviewStatus: SelfReviewStatus
  peerFeedbackCount: number
  managerEvaluationStatus: string
  finalScoreStatus: string
}

export interface CalibrationStats {
  totalEmployees: number
  averageScore: number
  scoreDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  bonusTierDistribution: {
    tier: BonusTier
    count: number
    percentage: number
  }[]
}

export interface CalibrationSession {
  id: string
  cycleId: string
  name: string
  participants: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface ScoreAdjustment {
  id: string
  employeeId: string
  employeeName: string
  cycleId: string
  originalScore: number
  requestedScore: number
  finalScore?: number
  justification: string
  status: string
  requestedBy: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

export interface FinalScore {
  id: string
  employeeId: string
  cycleId: string
  finalScore: number
  bonusTier: BonusTier
  selfReviewScore: number
  peerFeedbackScore: number
  managerScore: number
  calibrationAdjustment: number
  isLocked: boolean
  feedbackDeliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateReviewCycleDto {
  name: string
  year: number
  deadlines: ReviewCycleDeadlines
}

export interface UpdateSelfReviewDto {
  scores: Partial<PillarScores>
  narrative?: string
}

export interface NominatePeersDto {
  nomineeIds: string[]
}

export interface SubmitPeerFeedbackDto {
  revieweeId: string
  scores: PillarScores
  strengths: string
  growthAreas: string
  generalComments: string
}

export interface SubmitManagerEvaluationDto {
  scores: PillarScores
  strengths: string
  growthAreas: string
  promotionReadiness: string
  overallAssessment: string
}

export interface RequestScoreAdjustmentDto {
  employeeId: string
  requestedScore: number
  justification: string
}

export interface ApplyCalibrationAdjustmentDto {
  employeeId: string
  adjustedScore: number
  justification: string
}
