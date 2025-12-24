import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { SelfReview, PillarScores, ReviewCycle } from '../../types/performanceReviews'
import PillarScoreInput from '../../components/performance-reviews/PillarScoreInput'
import NarrativeInput from '../../components/performance-reviews/NarrativeInput'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const SelfReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [selfReview, setSelfReview] = useState<SelfReview | null>(null)
  const [scores, setScores] = useState<PillarScores>({
    projectImpact: 0,
    direction: 0,
    engineeringExcellence: 0,
    operationalOwnership: 0,
    peopleImpact: 0,
  })
  const [narrative, setNarrative] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const review = await performanceReviewsService.getMySelfReview(activeCycle.id)
      setSelfReview(review)
      setScores(review.scores)
      setNarrative(review.narrative || '')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load self-review data')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (pillar: keyof PillarScores, value: number) => {
    setScores((prev) => ({ ...prev, [pillar]: value }))
  }

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!cycle) return

      await performanceReviewsService.updateSelfReview(cycle.id, {
        scores,
        narrative,
      })

      setSuccessMessage('Draft saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!cycle) return

      // First save the current state
      await performanceReviewsService.updateSelfReview(cycle.id, {
        scores,
        narrative,
      })

      // Then submit
      await performanceReviewsService.submitSelfReview(cycle.id)

      setSuccessMessage('Self-review submitted successfully!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit self-review')
    } finally {
      setSaving(false)
    }
  }

  const isSubmitted = selfReview?.status === 'SUBMITTED'
  const deadlinePassed = cycle ? new Date(cycle.deadlines.selfReview) < new Date() : false

  if (loading) return <LoadingSpinner />

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Self-Review</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
            <span className="cycle-deadline">
              Deadline: {new Date(cycle.deadlines.selfReview).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {deadlinePassed && !isSubmitted && (
          <div className="warning-message">
            The self-review deadline has passed. You may not be able to submit changes.
          </div>
        )}

        {isSubmitted && (
          <div className="info-message">
            Your self-review has been submitted. You can view it below but cannot make changes.
          </div>
        )}

        <ReviewCard title="Meta's 5 Pillars Assessment" status={isSubmitted ? 'Submitted' : 'Draft'}>
          <div className="pillars-section">
            <p className="section-description">
              Rate yourself on each pillar from 0-4. Be honest and reflective about your
              contributions.
            </p>

            <PillarScoreInput
              pillar="projectImpact"
              label="Project Impact"
              value={scores.projectImpact}
              onChange={(value) => handleScoreChange('projectImpact', value)}
              disabled={isSubmitted}
            />

            <PillarScoreInput
              pillar="direction"
              label="Direction"
              value={scores.direction}
              onChange={(value) => handleScoreChange('direction', value)}
              disabled={isSubmitted}
            />

            <PillarScoreInput
              pillar="engineeringExcellence"
              label="Engineering Excellence"
              value={scores.engineeringExcellence}
              onChange={(value) => handleScoreChange('engineeringExcellence', value)}
              disabled={isSubmitted}
            />

            <PillarScoreInput
              pillar="operationalOwnership"
              label="Operational Ownership"
              value={scores.operationalOwnership}
              onChange={(value) => handleScoreChange('operationalOwnership', value)}
              disabled={isSubmitted}
            />

            <PillarScoreInput
              pillar="peopleImpact"
              label="People Impact"
              value={scores.peopleImpact}
              onChange={(value) => handleScoreChange('peopleImpact', value)}
              disabled={isSubmitted}
            />
          </div>
        </ReviewCard>

        <ReviewCard title="Narrative">
          <div className="narrative-section">
            <p className="section-description">
              Describe your accomplishments, challenges overcome, and impact delivered during this
              review period. Maximum 1000 words.
            </p>

            <NarrativeInput
              value={narrative}
              onChange={setNarrative}
              maxWords={1000}
              disabled={isSubmitted}
              placeholder="Describe your key accomplishments, projects delivered, challenges overcome, and the impact of your work..."
            />
          </div>
        </ReviewCard>

        {!isSubmitted && (
          <div className="action-buttons">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn-secondary"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || deadlinePassed}
              className="btn-primary"
            >
              {saving ? 'Submitting...' : 'Submit Self-Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelfReviewPage
