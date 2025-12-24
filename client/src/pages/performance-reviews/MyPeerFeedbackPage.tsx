import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, AggregatedPeerFeedback } from '../../types/performanceReviews'
import ScoreDisplay from '../../components/performance-reviews/ScoreDisplay'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const MyPeerFeedbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [feedback, setFeedback] = useState<AggregatedPeerFeedback | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const peerFeedback = await performanceReviewsService.getAggregatedFeedback(activeCycle.id)
      setFeedback(peerFeedback)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load peer feedback')
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
        <h1 className="page-title">My Peer Feedback</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}

        {feedback && (
          <>
            <div className="info-message">
              This feedback has been aggregated from {feedback.feedbackCount} peer review
              {feedback.feedbackCount !== 1 ? 's' : ''} and is anonymized to protect reviewer
              privacy.
            </div>

            <ReviewCard title="Aggregated Peer Scores">
              <ScoreDisplay scores={feedback.aggregatedScores} showAverage={true} />
            </ReviewCard>

            <ReviewCard title="Anonymous Comments">
              {feedback.anonymizedComments.length > 0 ? (
                <div className="comments-section">
                  {feedback.anonymizedComments.map((comment, index) => (
                    <div key={index} className="comment-item">
                      <div className="comment-pillar">{comment.pillar}</div>
                      <div className="comment-text">{comment.comment}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-comments">No written comments available yet.</p>
              )}
            </ReviewCard>

            <div className="feedback-tips">
              <h4>Understanding Your Peer Feedback:</h4>
              <ul>
                <li>
                  Scores are averaged across all peer reviewers to give you a balanced perspective
                </li>
                <li>Comments are anonymized and may be grouped by theme or pillar</li>
                <li>
                  Use this feedback to identify patterns and areas for growth or continued strength
                </li>
                <li>
                  Consider discussing this feedback with your manager during your 1-on-1 sessions
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyPeerFeedbackPage
