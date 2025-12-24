import api from './api'
import {
  ReviewCycle,
  SelfReview,
  CreateReviewCycleDto,
  UpdateSelfReviewDto,
  NominatePeersDto,
  SubmitPeerFeedbackDto,
  AggregatedPeerFeedback,
  PeerFeedbackRequest,
  TeamReview,
  EmployeeReview,
  SubmitManagerEvaluationDto,
  CalibrationStats,
  CalibrationSession,
  ScoreAdjustment,
  RequestScoreAdjustmentDto,
  ApplyCalibrationAdjustmentDto,
  FinalScore,
  PeerNomination,
} from '../types/performanceReviews'

export const performanceReviewsService = {
  // Review Cycles
  async getActiveCycle(): Promise<ReviewCycle> {
    const { data } = await api.get('/performance-reviews/cycles/active')
    return data
  },

  async listCycles(params?: {
    year?: number
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ cycles: ReviewCycle[]; total: number; limit: number; offset: number }> {
    const { data } = await api.get('/performance-reviews/cycles', { params })
    return data
  },

  async createCycle(dto: CreateReviewCycleDto): Promise<ReviewCycle> {
    const { data } = await api.post('/performance-reviews/cycles', dto)
    return data
  },

  async startCycle(cycleId: string): Promise<{ id: string; status: string; startedAt: string }> {
    const { data } = await api.post(`/performance-reviews/cycles/${cycleId}/start`)
    return data
  },

  // Self Reviews
  async getMySelfReview(cycleId: string): Promise<SelfReview> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/self-review`)
    return data
  },

  async updateSelfReview(cycleId: string, dto: UpdateSelfReviewDto): Promise<SelfReview> {
    const { data } = await api.put(`/performance-reviews/cycles/${cycleId}/self-review`, dto)
    return data
  },

  async submitSelfReview(
    cycleId: string,
  ): Promise<{ id: string; status: string; submittedAt: string }> {
    const { data } = await api.post(`/performance-reviews/cycles/${cycleId}/self-review/submit`)
    return data
  },

  // Peer Feedback
  async nominatePeers(
    cycleId: string,
    dto: NominatePeersDto,
  ): Promise<{ nominations: PeerNomination[] }> {
    const { data } = await api.post(`/performance-reviews/cycles/${cycleId}/peer-nominations`, dto)
    return data
  },

  async getPeerFeedbackRequests(
    cycleId: string,
  ): Promise<{ requests: PeerFeedbackRequest[]; total: number }> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/peer-feedback/requests`)
    return data
  },

  async submitPeerFeedback(
    cycleId: string,
    dto: SubmitPeerFeedbackDto,
  ): Promise<{ id: string; revieweeId: string; submittedAt: string; isAnonymized: boolean }> {
    const { data } = await api.post(`/performance-reviews/cycles/${cycleId}/peer-feedback`, dto)
    return data
  },

  async getAggregatedFeedback(cycleId: string): Promise<AggregatedPeerFeedback> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/peer-feedback`)
    return data
  },

  // Manager Evaluations
  async getTeamReviews(cycleId: string): Promise<{ reviews: TeamReview[]; total: number }> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/team-reviews`)
    return data
  },

  async getEmployeeReview(cycleId: string, employeeId: string): Promise<EmployeeReview> {
    const { data } = await api.get(
      `/performance-reviews/cycles/${cycleId}/employees/${employeeId}/review`,
    )
    return data
  },

  async submitManagerEvaluation(
    cycleId: string,
    employeeId: string,
    dto: SubmitManagerEvaluationDto,
  ): Promise<{ id: string; employeeId: string; submittedAt: string }> {
    const { data } = await api.post(
      `/performance-reviews/cycles/${cycleId}/employees/${employeeId}/evaluation`,
      dto,
    )
    return data
  },

  // Calibration
  async getCalibrationDashboard(cycleId: string, params?: {
    department?: string
    manager?: string
  }): Promise<CalibrationStats> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/calibration`, {
      params,
    })
    return data
  },

  async createCalibrationSession(
    cycleId: string,
    sessionData: { name: string; participants: string[] },
  ): Promise<CalibrationSession> {
    const { data } = await api.post(
      `/performance-reviews/cycles/${cycleId}/calibration/sessions`,
      sessionData,
    )
    return data
  },

  async applyAdjustment(
    cycleId: string,
    sessionId: string,
    dto: ApplyCalibrationAdjustmentDto,
  ): Promise<{ employeeId: string; adjustedScore: number; appliedAt: string }> {
    const { data } = await api.post(
      `/performance-reviews/cycles/${cycleId}/calibration/sessions/${sessionId}/adjustments`,
      dto,
    )
    return data
  },

  async lockScores(cycleId: string): Promise<{ cycleId: string; lockedAt: string; count: number }> {
    const { data } = await api.post(`/performance-reviews/cycles/${cycleId}/scores/lock`)
    return data
  },

  // Score Adjustments
  async requestAdjustment(
    cycleId: string,
    employeeId: string,
    dto: RequestScoreAdjustmentDto,
  ): Promise<ScoreAdjustment> {
    const { data } = await api.post(
      `/performance-reviews/cycles/${cycleId}/employees/${employeeId}/adjustment-request`,
      dto,
    )
    return data
  },

  async listAdjustmentRequests(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ adjustments: ScoreAdjustment[]; total: number; limit: number; offset: number }> {
    const { data } = await api.get(`/performance-reviews/adjustment-requests`, {
      params,
    })
    return data
  },

  async reviewAdjustment(
    requestId: string,
    decision: { approved: boolean; reviewerNotes?: string },
  ): Promise<ScoreAdjustment> {
    const { data } = await api.post(
      `/performance-reviews/adjustment-requests/${requestId}/review`,
      decision,
    )
    return data
  },

  // Final Scores
  async getMyFinalScore(cycleId: string): Promise<FinalScore> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/my-score`)
    return data
  },

  async getTeamFinalScores(cycleId: string, params?: {
    department?: string
    limit?: number
    offset?: number
  }): Promise<{ scores: FinalScore[]; total: number; limit: number; offset: number }> {
    const { data } = await api.get(`/performance-reviews/cycles/${cycleId}/team-scores`, {
      params,
    })
    return data
  },

  async markFeedbackDelivered(
    cycleId: string,
    employeeId: string,
  ): Promise<{ employeeId: string; deliveredAt: string }> {
    const { data } = await api.post(
      `/performance-reviews/cycles/${cycleId}/employees/${employeeId}/feedback-delivered`,
    )
    return data
  },
}

export default performanceReviewsService
