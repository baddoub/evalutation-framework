import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, CreateReviewCycleDto } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import './PerformanceReviewsPages.css'

const AdminReviewCyclesPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cycles, setCycles] = useState<ReviewCycle[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<CreateReviewCycleDto>({
    name: '',
    year: new Date().getFullYear(),
    deadlines: {
      selfReview: '',
      peerFeedback: '',
      managerEval: '',
      calibration: '',
      feedbackDelivery: '',
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { cycles: cyclesList } = await performanceReviewsService.listCycles()
      setCycles(cyclesList)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load review cycles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      await performanceReviewsService.createCycle(formData)

      setSuccessMessage('Review cycle created successfully!')
      setShowCreateForm(false)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create review cycle')
    } finally {
      setSaving(false)
    }
  }

  const handleStartCycle = async (cycleId: string) => {
    try {
      setSaving(true)
      setError(null)

      await performanceReviewsService.startCycle(cycleId)

      setSuccessMessage('Review cycle started successfully!')
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start review cycle')
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
        <h1 className="page-title">Manage Review Cycles</h1>
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} />}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="action-buttons" style={{ justifyContent: 'flex-start', marginBottom: '24px' }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
            {showCreateForm ? 'Cancel' : '+ Create New Cycle'}
          </button>
        </div>

        {showCreateForm && (
          <ReviewCard title="Create New Review Cycle">
            <div className="form-group">
              <label className="form-label">Cycle Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="nominee-input"
                placeholder="e.g., H1 2025 Performance Review"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="nominee-input"
              />
            </div>

            <h4 style={{ marginTop: '24px', marginBottom: '16px' }}>Deadlines</h4>

            <div className="form-group">
              <label className="form-label">Self-Review Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadlines.selfReview}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlines: { ...formData.deadlines, selfReview: e.target.value },
                  })
                }
                className="nominee-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Peer Feedback Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadlines.peerFeedback}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlines: { ...formData.deadlines, peerFeedback: e.target.value },
                  })
                }
                className="nominee-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manager Evaluation Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadlines.managerEval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlines: { ...formData.deadlines, managerEval: e.target.value },
                  })
                }
                className="nominee-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Calibration Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadlines.calibration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlines: { ...formData.deadlines, calibration: e.target.value },
                  })
                }
                className="nominee-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Feedback Delivery Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadlines.feedbackDelivery}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadlines: { ...formData.deadlines, feedbackDelivery: e.target.value },
                  })
                }
                className="nominee-input"
              />
            </div>

            <div className="action-buttons">
              <button onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateCycle} disabled={saving} className="btn-primary">
                {saving ? 'Creating...' : 'Create Cycle'}
              </button>
            </div>
          </ReviewCard>
        )}

        <ReviewCard title={`All Review Cycles (${cycles.length})`}>
          <div className="team-reviews-table">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Self-Review Deadline</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => (
                  <tr key={cycle.id}>
                    <td>{cycle.name}</td>
                    <td>{cycle.year}</td>
                    <td>
                      <span className={`status-badge status-${cycle.status.toLowerCase()}`}>
                        {cycle.status}
                      </span>
                    </td>
                    <td>{new Date(cycle.deadlines.selfReview).toLocaleDateString()}</td>
                    <td>{new Date(cycle.createdAt).toLocaleDateString()}</td>
                    <td>
                      {cycle.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStartCycle(cycle.id)}
                          disabled={saving}
                          className="btn-view"
                        >
                          Start Cycle
                        </button>
                      )}
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

export default AdminReviewCyclesPage
