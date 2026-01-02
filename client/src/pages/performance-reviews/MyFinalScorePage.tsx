import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, FinalScore } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import BonusTierBadge from '../../components/performance-reviews/BonusTierBadge'
import './PerformanceReviewsPages.css'

const MyFinalScorePage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [finalScore, setFinalScore] = useState<FinalScore | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      try {
        const score = await performanceReviewsService.getMyFinalScore(activeCycle.id)
        setFinalScore(score)
      } catch (scoreErr: any) {
        // If 404, final score not yet available - this is not an error
        if (scoreErr.response?.status === 404) {
          setFinalScore(null)
        } else {
          throw scoreErr
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">My Final Score</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}

        {!error && !finalScore && (
          <div className="info-card">
            <h3>Final Score Not Yet Available</h3>
            <p>Your final performance score will be available after:</p>
            <ul style={{ textAlign: 'left', margin: '16px auto', maxWidth: '400px' }}>
              <li>All peer feedback has been collected</li>
              <li>Your manager has completed their evaluation</li>
              <li>The calibration process is complete</li>
            </ul>
            <p>Check back after the review cycle is finalized.</p>
            {cycle && (
              <p style={{ marginTop: '16px', color: '#666' }}>
                <strong>Calibration deadline:</strong>{' '}
                {new Date(cycle.deadlines.calibration).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {finalScore && (
          <>
            <div className="final-score-summary">
              <div className="score-summary-card highlighted">
                <div className="score-summary-label">Final Score</div>
                <div className="score-summary-value">{finalScore.finalScore.toFixed(2)}</div>
                <div className="score-summary-description">Overall Performance</div>
              </div>

              <div className="score-summary-card">
                <div className="score-summary-label">Bonus Tier</div>
                <div className="score-summary-value">
                  <BonusTierBadge tier={finalScore.bonusTier} />
                </div>
                <div className="score-summary-description">Compensation Impact</div>
              </div>

              <div className="score-summary-card">
                <div className="score-summary-label">Status</div>
                <div className="score-summary-value" style={{ fontSize: '18px' }}>
                  {finalScore.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                </div>
                <div className="score-summary-description">
                  {finalScore.feedbackDeliveredAt ? 'Feedback Delivered' : 'Pending Delivery'}
                </div>
              </div>
            </div>

            <ReviewCard title="Score Breakdown">
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Self-Review Score</span>
                  <span className="breakdown-value">{finalScore.selfReviewScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Peer Feedback Score</span>
                  <span className="breakdown-value">{finalScore.peerFeedbackScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Manager Score</span>
                  <span className="breakdown-value">{finalScore.managerScore.toFixed(2)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Calibration Adjustment</span>
                  <span className="breakdown-value">
                    {finalScore.calibrationAdjustment >= 0 ? '+' : ''}
                    {finalScore.calibrationAdjustment.toFixed(2)}
                  </span>
                </div>
              </div>
            </ReviewCard>

            <div className="info-message">
              {finalScore.feedbackDeliveredAt
                ? `Feedback was delivered on ${new Date(finalScore.feedbackDeliveredAt).toLocaleDateString()}`
                : 'Your manager will schedule a 1-on-1 to discuss your performance review and final score.'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyFinalScorePage
