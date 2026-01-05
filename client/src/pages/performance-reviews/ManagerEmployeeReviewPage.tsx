import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, PillarScores } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import PillarScoreInput from '../../components/performance-reviews/PillarScoreInput'
import './PerformanceReviewsPages.css'

interface EmployeeReviewData {
  employee: {
    id: string
    name: string
    email: string
    level: string
    department: string
  }
  selfReview: {
    scores: PillarScores
    narrative: string
    submittedAt?: string
  }
  peerFeedback: {
    count: number
    aggregatedScores: PillarScores
    attributedFeedback: Array<{
      reviewerName: string
      scores: PillarScores
      strengths: string
      growthAreas: string
    }>
  }
  managerEvaluation: {
    id: string
    status: string
    scores: PillarScores
    narrative: string
  } | null
}

const ManagerEmployeeReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { employeeId } = useParams<{ employeeId: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [reviewData, setReviewData] = useState<EmployeeReviewData | null>(null)

  const [scores, setScores] = useState<PillarScores>({
    projectImpact: 3,
    direction: 3,
    engineeringExcellence: 3,
    operationalOwnership: 3,
    peopleImpact: 3,
  })
  const [narrative, setNarrative] = useState('')
  const [strengths, setStrengths] = useState('')
  const [growthAreas, setGrowthAreas] = useState('')
  const [developmentPlan, setDevelopmentPlan] = useState('')

  useEffect(() => {
    if (employeeId) {
      loadData()
    }
  }, [employeeId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const data = await performanceReviewsService.getEmployeeReview(activeCycle.id, employeeId!)
      setReviewData(data as unknown as EmployeeReviewData)

      if (data.managerEvaluation) {
        setScores(data.managerEvaluation.scores as PillarScores)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employee review')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (pillar: keyof PillarScores, value: number) => {
    setScores((prev) => ({ ...prev, [pillar]: value }))
  }

  const handleSubmit = async () => {
    if (!cycle || !employeeId) return

    if (!narrative.trim() || !strengths.trim() || !growthAreas.trim() || !developmentPlan.trim()) {
      setError('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await performanceReviewsService.submitManagerEvaluation(cycle.id, employeeId, {
        scores,
        narrative,
        strengths,
        growthAreas,
        developmentPlan,
      } as any)

      setSuccess('Manager evaluation submitted successfully!')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const formatScore = (score: number) => {
    return score > 0 ? score.toFixed(1) : '-'
  }

  if (loading) return <LoadingSpinner />

  const hasSubmittedEvaluation = reviewData?.managerEvaluation?.status === 'SUBMITTED' ||
    reviewData?.managerEvaluation?.status === 'CALIBRATED'

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/reviews/team')} className="btn-back">
          ← Back to Team Reviews
        </button>
        <h1 className="page-title">Employee Review</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}
        {success && <div className="success-message">{success}</div>}

        {reviewData && (
          <>
            <ReviewCard title="Employee Information">
              <div className="employee-info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{reviewData.employee.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{reviewData.employee.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Level</span>
                  <span className="info-value">{reviewData.employee.level || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{reviewData.employee.department || 'N/A'}</span>
                </div>
              </div>
            </ReviewCard>

            <ReviewCard title="Self-Review">
              {reviewData.selfReview.submittedAt ? (
                <>
                  <div className="scores-grid">
                    <div className="score-item">
                      <span className="score-label">Project Impact</span>
                      <span className="score-value">{formatScore(reviewData.selfReview.scores.projectImpact)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Direction</span>
                      <span className="score-value">{formatScore(reviewData.selfReview.scores.direction)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Engineering Excellence</span>
                      <span className="score-value">{formatScore(reviewData.selfReview.scores.engineeringExcellence)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Operational Ownership</span>
                      <span className="score-value">{formatScore(reviewData.selfReview.scores.operationalOwnership)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">People Impact</span>
                      <span className="score-value">{formatScore(reviewData.selfReview.scores.peopleImpact)}</span>
                    </div>
                  </div>
                  {reviewData.selfReview.narrative && (
                    <div className="narrative-section">
                      <h4>Narrative</h4>
                      <p>{reviewData.selfReview.narrative}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="no-data">Self-review not yet submitted</p>
              )}
            </ReviewCard>

            <ReviewCard title={`Peer Feedback (${reviewData.peerFeedback.count} responses)`}>
              {reviewData.peerFeedback.count > 0 ? (
                <>
                  <div className="scores-grid">
                    <div className="score-item">
                      <span className="score-label">Project Impact</span>
                      <span className="score-value">{formatScore(reviewData.peerFeedback.aggregatedScores.projectImpact)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Direction</span>
                      <span className="score-value">{formatScore(reviewData.peerFeedback.aggregatedScores.direction)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Engineering Excellence</span>
                      <span className="score-value">{formatScore(reviewData.peerFeedback.aggregatedScores.engineeringExcellence)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Operational Ownership</span>
                      <span className="score-value">{formatScore(reviewData.peerFeedback.aggregatedScores.operationalOwnership)}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">People Impact</span>
                      <span className="score-value">{formatScore(reviewData.peerFeedback.aggregatedScores.peopleImpact)}</span>
                    </div>
                  </div>
                  {reviewData.peerFeedback.attributedFeedback.length > 0 && (
                    <div className="feedback-list">
                      <h4>Individual Feedback</h4>
                      {reviewData.peerFeedback.attributedFeedback.map((feedback, index) => (
                        <div key={index} className="feedback-item">
                          <div className="feedback-header">
                            <strong>{feedback.reviewerName}</strong>
                          </div>
                          {feedback.strengths && (
                            <div className="feedback-section">
                              <span className="section-label">Strengths:</span>
                              <p>{feedback.strengths}</p>
                            </div>
                          )}
                          {feedback.growthAreas && (
                            <div className="feedback-section">
                              <span className="section-label">Growth Areas:</span>
                              <p>{feedback.growthAreas}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="no-data">No peer feedback received yet</p>
              )}
            </ReviewCard>

            {hasSubmittedEvaluation ? (
              <ReviewCard title="Manager Evaluation (Submitted)">
                <div className="evaluation-status">
                  <span className={`status-badge status-${reviewData.managerEvaluation?.status.toLowerCase()}`}>
                    {reviewData.managerEvaluation?.status}
                  </span>
                </div>
                <div className="scores-grid">
                  <div className="score-item">
                    <span className="score-label">Project Impact</span>
                    <span className="score-value">{reviewData.managerEvaluation?.scores.projectImpact}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Direction</span>
                    <span className="score-value">{reviewData.managerEvaluation?.scores.direction}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Engineering Excellence</span>
                    <span className="score-value">{reviewData.managerEvaluation?.scores.engineeringExcellence}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Operational Ownership</span>
                    <span className="score-value">{reviewData.managerEvaluation?.scores.operationalOwnership}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">People Impact</span>
                    <span className="score-value">{reviewData.managerEvaluation?.scores.peopleImpact}</span>
                  </div>
                </div>
                {reviewData.managerEvaluation?.narrative && (
                  <div className="narrative-section">
                    <h4>Overall Assessment</h4>
                    <p>{reviewData.managerEvaluation.narrative}</p>
                  </div>
                )}
              </ReviewCard>
            ) : (
              <ReviewCard title="Submit Manager Evaluation">
                <div className="evaluation-form">
                  <h4>Performance Scores</h4>
                  <div className="scores-input-grid">
                    <PillarScoreInput
                      pillar="projectImpact"
                      label="Project Impact"
                      value={scores.projectImpact}
                      onChange={(v) => handleScoreChange('projectImpact', v)}
                    />
                    <PillarScoreInput
                      pillar="direction"
                      label="Direction"
                      value={scores.direction}
                      onChange={(v) => handleScoreChange('direction', v)}
                    />
                    <PillarScoreInput
                      pillar="engineeringExcellence"
                      label="Engineering Excellence"
                      value={scores.engineeringExcellence}
                      onChange={(v) => handleScoreChange('engineeringExcellence', v)}
                    />
                    <PillarScoreInput
                      pillar="operationalOwnership"
                      label="Operational Ownership"
                      value={scores.operationalOwnership}
                      onChange={(v) => handleScoreChange('operationalOwnership', v)}
                    />
                    <PillarScoreInput
                      pillar="peopleImpact"
                      label="People Impact"
                      value={scores.peopleImpact}
                      onChange={(v) => handleScoreChange('peopleImpact', v)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Overall Assessment *</label>
                    <textarea
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value)}
                      placeholder="Provide an overall assessment of the employee's performance..."
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Strengths *</label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="What are this employee's key strengths?"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Growth Areas *</label>
                    <textarea
                      value={growthAreas}
                      onChange={(e) => setGrowthAreas(e.target.value)}
                      placeholder="What areas should this employee focus on for growth?"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Development Plan *</label>
                    <textarea
                      value={developmentPlan}
                      onChange={(e) => setDevelopmentPlan(e.target.value)}
                      placeholder="Outline a development plan for the next review period..."
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-submit"
                  >
                    {submitting ? 'Submitting...' : 'Submit Evaluation'}
                  </button>
                </div>
              </ReviewCard>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ManagerEmployeeReviewPage
