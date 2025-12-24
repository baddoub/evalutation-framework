import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, PillarScores, PeerFeedbackRequest } from '../../types/performanceReviews'
import PillarScoreInput from '../../components/performance-reviews/PillarScoreInput'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const PeerFeedbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const revieweeIdParam = searchParams.get('revieweeId')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [requests, setRequests] = useState<PeerFeedbackRequest[]>([])
  const [selectedRevieweeId, setSelectedRevieweeId] = useState<string>(revieweeIdParam || '')
  const [scores, setScores] = useState<PillarScores>({
    projectImpact: 0,
    direction: 0,
    engineeringExcellence: 0,
    operationalOwnership: 0,
    peopleImpact: 0,
  })
  const [strengths, setStrengths] = useState('')
  const [growthAreas, setGrowthAreas] = useState('')
  const [generalComments, setGeneralComments] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const feedbackRequests = await performanceReviewsService.getPeerFeedbackRequests(
        activeCycle.id,
      )
      setRequests(feedbackRequests.requests)

      if (feedbackRequests.requests.length > 0 && !revieweeIdParam) {
        setSelectedRevieweeId(feedbackRequests.requests[0].revieweeId)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load peer feedback requests')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (pillar: keyof PillarScores, value: number) => {
    setScores((prev) => ({ ...prev, [pillar]: value }))
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!cycle || !selectedRevieweeId) return

      await performanceReviewsService.submitPeerFeedback(cycle.id, {
        revieweeId: selectedRevieweeId,
        scores,
        strengths,
        growthAreas,
        generalComments,
      })

      setSuccessMessage('Peer feedback submitted successfully!')

      // Reset form
      setScores({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })
      setStrengths('')
      setGrowthAreas('')
      setGeneralComments('')

      // Reload requests
      setTimeout(() => {
        loadData()
        setSuccessMessage(null)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit peer feedback')
    } finally {
      setSaving(false)
    }
  }

  const selectedRequest = requests.find((r) => r.revieweeId === selectedRevieweeId)

  if (loading) return <LoadingSpinner />

  if (requests.length === 0) {
    return (
      <div className="performance-review-page">
        <div className="page-header">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Back to Dashboard
          </button>
          <h1 className="page-title">Peer Feedback</h1>
        </div>
        <div className="page-content">
          <div className="info-message">
            You have no pending peer feedback requests at this time.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Submit Peer Feedback</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
            <span className="cycle-deadline">
              Deadline: {new Date(cycle.deadlines.peerFeedback).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} />}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <ReviewCard title="Select Colleague">
          <div className="reviewee-selector">
            <label className="form-label">Choose colleague to review:</label>
            <select
              value={selectedRevieweeId}
              onChange={(e) => setSelectedRevieweeId(e.target.value)}
              className="reviewee-select"
            >
              {requests.map((request) => (
                <option key={request.revieweeId} value={request.revieweeId}>
                  {request.revieweeName} ({request.revieweeEmail}) -{' '}
                  {request.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                </option>
              ))}
            </select>
            {selectedRequest && (
              <div className="request-info">
                <p>
                  <strong>Due:</strong>{' '}
                  {new Date(selectedRequest.dueDate).toLocaleDateString()}
                </p>
                <p className="anonymity-note">
                  Note: Your feedback will be anonymized and aggregated with other peer reviews.
                </p>
              </div>
            )}
          </div>
        </ReviewCard>

        <ReviewCard title="Performance Assessment">
          <div className="pillars-section">
            <p className="section-description">
              Rate your colleague's performance on each pillar from 0-4. Your feedback will remain
              anonymous.
            </p>

            <PillarScoreInput
              pillar="projectImpact"
              label="Project Impact"
              value={scores.projectImpact}
              onChange={(value) => handleScoreChange('projectImpact', value)}
            />

            <PillarScoreInput
              pillar="direction"
              label="Direction"
              value={scores.direction}
              onChange={(value) => handleScoreChange('direction', value)}
            />

            <PillarScoreInput
              pillar="engineeringExcellence"
              label="Engineering Excellence"
              value={scores.engineeringExcellence}
              onChange={(value) => handleScoreChange('engineeringExcellence', value)}
            />

            <PillarScoreInput
              pillar="operationalOwnership"
              label="Operational Ownership"
              value={scores.operationalOwnership}
              onChange={(value) => handleScoreChange('operationalOwnership', value)}
            />

            <PillarScoreInput
              pillar="peopleImpact"
              label="People Impact"
              value={scores.peopleImpact}
              onChange={(value) => handleScoreChange('peopleImpact', value)}
            />
          </div>
        </ReviewCard>

        <ReviewCard title="Written Feedback">
          <div className="feedback-section">
            <div className="form-group">
              <label className="form-label">Strengths</label>
              <p className="field-description">
                What does this person do particularly well? What should they continue doing?
              </p>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Describe their key strengths and what they excel at..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Growth Areas</label>
              <p className="field-description">
                What areas could this person improve? What would make them more effective?
              </p>
              <textarea
                value={growthAreas}
                onChange={(e) => setGrowthAreas(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Suggest areas for development and improvement..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">General Comments</label>
              <p className="field-description">
                Any additional feedback or context you would like to share?
              </p>
              <textarea
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Any other observations or feedback..."
              />
            </div>
          </div>
        </ReviewCard>

        <div className="action-buttons">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PeerFeedbackPage
