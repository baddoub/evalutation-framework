import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const PeerNominationPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [nomineeIds, setNomineeIds] = useState<string[]>(['', '', ''])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load review cycle data')
    } finally {
      setLoading(false)
    }
  }

  const handleNomineeChange = (index: number, value: string) => {
    const updated = [...nomineeIds]
    updated[index] = value
    setNomineeIds(updated)
  }

  const addNominee = () => {
    if (nomineeIds.length < 5) {
      setNomineeIds([...nomineeIds, ''])
    }
  }

  const removeNominee = (index: number) => {
    if (nomineeIds.length > 3) {
      const updated = nomineeIds.filter((_, i) => i !== index)
      setNomineeIds(updated)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!cycle) return

      const validIds = nomineeIds.filter((id) => id.trim() !== '')

      if (validIds.length < 3) {
        setError('Please nominate at least 3 peers')
        return
      }

      await performanceReviewsService.nominatePeers(cycle.id, {
        nomineeIds: validIds,
      })

      setSuccessMessage('Peer nominations submitted successfully!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit nominations')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Nominate Peer Reviewers</h1>
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

        <ReviewCard title="Select Your Peer Reviewers">
          <div className="nomination-section">
            <p className="section-description">
              Nominate 3-5 colleagues who can provide meaningful feedback on your performance.
              Choose people you have worked closely with during this review period.
            </p>

            <div className="nominees-list">
              {nomineeIds.map((nomineeId, index) => (
                <div key={index} className="nominee-input-row">
                  <label className="nominee-label">
                    Peer {index + 1} {index < 3 && <span className="required">*</span>}
                  </label>
                  <div className="nominee-input-group">
                    <input
                      type="text"
                      value={nomineeId}
                      onChange={(e) => handleNomineeChange(index, e.target.value)}
                      placeholder="Enter employee ID or email"
                      className="nominee-input"
                    />
                    {index >= 3 && (
                      <button
                        type="button"
                        onClick={() => removeNominee(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {nomineeIds.length < 5 && (
              <button type="button" onClick={addNominee} className="btn-add-nominee">
                + Add Another Peer
              </button>
            )}
          </div>

          <div className="nomination-tips">
            <h4>Tips for selecting peer reviewers:</h4>
            <ul>
              <li>Choose colleagues from different projects or teams you have collaborated with</li>
              <li>Select people who can speak to different aspects of your work</li>
              <li>Consider both technical and cross-functional partners</li>
              <li>Ensure reviewers have worked with you recently during this review period</li>
            </ul>
          </div>
        </ReviewCard>

        <div className="action-buttons">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Submitting...' : 'Submit Nominations'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PeerNominationPage
