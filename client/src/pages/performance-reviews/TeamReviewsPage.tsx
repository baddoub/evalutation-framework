import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, TeamReview } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const TeamReviewsPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [teamReviews, setTeamReviews] = useState<TeamReview[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const { reviews } = await performanceReviewsService.getTeamReviews(activeCycle.id)
      setTeamReviews(reviews)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleViewEmployee = (employeeId: string) => {
    navigate(`/reviews/manager/employee/${employeeId}`)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Team Reviews</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
            <span className="cycle-deadline">
              Manager Eval Deadline: {new Date(cycle.deadlines.managerEval).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}

        <ReviewCard title={`Team Members (${teamReviews.length})`}>
          <div className="team-reviews-table">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Level</th>
                  <th>Self-Review</th>
                  <th>Peer Feedback</th>
                  <th>Manager Eval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamReviews.map((review) => (
                  <tr key={review.employeeId}>
                    <td>{review.employeeName}</td>
                    <td>{review.employeeLevel || 'N/A'}</td>
                    <td>
                      <span
                        className={`status-badge status-${review.selfReviewStatus.toLowerCase()}`}
                      >
                        {review.selfReviewStatus}
                      </span>
                    </td>
                    <td>
                      <span className="feedback-count">{review.peerFeedbackCount} received</span>
                      <span
                        className={`status-badge status-${review.peerFeedbackStatus.toLowerCase()}`}
                        style={{ marginLeft: '8px' }}
                      >
                        {review.peerFeedbackStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${review.managerEvalStatus.toLowerCase()}`}
                      >
                        {review.managerEvalStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewEmployee(review.employeeId)}
                        className="btn-view"
                      >
                        {review.hasSubmittedEvaluation ? 'View' : 'Evaluate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReviewCard>
      </div>
    </div>
  )
}

export default TeamReviewsPage
