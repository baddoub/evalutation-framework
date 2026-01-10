import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import performanceReviewsService from '../../services/performanceReviewsService'
import { ReviewCycle, PillarScores } from '../../types/performanceReviews'
import LoadingSpinner from '../../components/performance-reviews/LoadingSpinner'
import ErrorMessage from '../../components/performance-reviews/ErrorMessage'
import ReviewCard from '../../components/performance-reviews/ReviewCard'
import BonusTierBadge from '../../components/performance-reviews/BonusTierBadge'
import './PerformanceReviewsPages.css'

interface CalibrationEvaluation {
  employeeId: string
  employeeName: string
  level: string
  department: string
  managerId: string
  managerName: string
  scores: PillarScores
  weightedScore: number
  percentageScore: number
  bonusTier: 'EXCEEDS' | 'MEETS' | 'BELOW'
  calibrationStatus: 'PENDING' | 'CALIBRATED' | 'LOCKED'
}

interface CalibrationDashboardData {
  summary: {
    totalEvaluations: number
    byBonusTier: {
      EXCEEDS: number
      MEETS: number
      BELOW: number
    }
    byDepartment: Record<string, { EXCEEDS: number; MEETS: number; BELOW: number }>
  }
  evaluations: CalibrationEvaluation[]
}

const CalibrationDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<ReviewCycle | null>(null)
  const [data, setData] = useState<CalibrationDashboardData | null>(null)
  const [locking, setLocking] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const activeCycle = await performanceReviewsService.getActiveCycle()
      setCycle(activeCycle)

      const dashboardData = await performanceReviewsService.getCalibrationDashboard(activeCycle.id)
      setData(dashboardData as unknown as CalibrationDashboardData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calibration data')
    } finally {
      setLoading(false)
    }
  }

  const handleLockScores = async () => {
    if (!cycle) return

    const confirmed = window.confirm(
      'Are you sure you want to lock all final scores? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setLocking(true)
      await performanceReviewsService.lockScores(cycle.id)
      alert('Scores locked successfully!')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to lock scores')
    } finally {
      setLocking(false)
    }
  }

  const handleViewEmployee = (employeeId: string) => {
    navigate(`/reviews/manager/employee/${employeeId}`)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'EXCEEDS': return '#22c55e'
      case 'MEETS': return '#3b82f6'
      case 'BELOW': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CALIBRATED': return '#22c55e'
      case 'LOCKED': return '#8b5cf6'
      case 'PENDING': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  if (loading) return <LoadingSpinner />

  const totalExceeds = data?.summary.byBonusTier.EXCEEDS || 0
  const totalMeets = data?.summary.byBonusTier.MEETS || 0
  const totalBelow = data?.summary.byBonusTier.BELOW || 0
  const total = data?.summary.totalEvaluations || 0

  return (
    <div className="performance-review-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Calibration Dashboard</h1>
        {cycle && (
          <div className="cycle-info">
            <span className="cycle-name">{cycle.name}</span>
            <span className="cycle-deadline">
              Calibration Deadline: {new Date(cycle.deadlines.calibration).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="page-content">
        {error && <ErrorMessage message={error} onRetry={loadData} />}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="calibration-summary">
              <div className="summary-card">
                <div className="summary-label">Total Evaluations</div>
                <div className="summary-value">{total}</div>
              </div>
              <div className="summary-card" style={{ borderColor: getTierColor('EXCEEDS') }}>
                <div className="summary-label">Exceeds</div>
                <div className="summary-value" style={{ color: getTierColor('EXCEEDS') }}>
                  {totalExceeds}
                  <span className="summary-percent">
                    ({total > 0 ? Math.round((totalExceeds / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="summary-card" style={{ borderColor: getTierColor('MEETS') }}>
                <div className="summary-label">Meets</div>
                <div className="summary-value" style={{ color: getTierColor('MEETS') }}>
                  {totalMeets}
                  <span className="summary-percent">
                    ({total > 0 ? Math.round((totalMeets / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="summary-card" style={{ borderColor: getTierColor('BELOW') }}>
                <div className="summary-label">Below</div>
                <div className="summary-value" style={{ color: getTierColor('BELOW') }}>
                  {totalBelow}
                  <span className="summary-percent">
                    ({total > 0 ? Math.round((totalBelow / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Distribution Bar */}
            <ReviewCard title="Bonus Tier Distribution">
              <div className="distribution-bar">
                {totalExceeds > 0 && (
                  <div
                    className="distribution-segment exceeds"
                    style={{ width: `${(totalExceeds / total) * 100}%` }}
                    title={`Exceeds: ${totalExceeds}`}
                  />
                )}
                {totalMeets > 0 && (
                  <div
                    className="distribution-segment meets"
                    style={{ width: `${(totalMeets / total) * 100}%` }}
                    title={`Meets: ${totalMeets}`}
                  />
                )}
                {totalBelow > 0 && (
                  <div
                    className="distribution-segment below"
                    style={{ width: `${(totalBelow / total) * 100}%` }}
                    title={`Below: ${totalBelow}`}
                  />
                )}
              </div>
              <div className="distribution-legend">
                <span className="legend-item">
                  <span className="legend-color exceeds" /> Exceeds
                </span>
                <span className="legend-item">
                  <span className="legend-color meets" /> Meets
                </span>
                <span className="legend-item">
                  <span className="legend-color below" /> Below
                </span>
              </div>
            </ReviewCard>

            {/* Evaluations Table */}
            <ReviewCard title={`Employee Evaluations (${data.evaluations.length})`}>
              <div className="calibration-actions">
                <button
                  onClick={handleLockScores}
                  disabled={locking || data.evaluations.every(e => e.calibrationStatus === 'LOCKED')}
                  className="btn-lock"
                >
                  {locking ? 'Locking...' : 'Lock All Scores'}
                </button>
              </div>
              <div className="team-reviews-table">
                <table className="reviews-table calibration-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Manager</th>
                      <th>Weighted Score</th>
                      <th>Bonus Tier</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.evaluations.map((evaluation) => (
                      <tr key={evaluation.employeeId}>
                        <td>
                          <div className="employee-cell">
                            <span className="employee-name">{evaluation.employeeName}</span>
                            <span className="employee-level">{evaluation.level}</span>
                          </div>
                        </td>
                        <td>{evaluation.department}</td>
                        <td>{evaluation.managerName}</td>
                        <td>
                          <div className="score-cell">
                            <span className="weighted-score">{evaluation.weightedScore.toFixed(2)}</span>
                            <span className="percentage-score">({evaluation.percentageScore.toFixed(0)}%)</span>
                          </div>
                        </td>
                        <td>
                          <BonusTierBadge tier={evaluation.bonusTier as any} />
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getStatusColor(evaluation.calibrationStatus),
                              color: 'white',
                            }}
                          >
                            {evaluation.calibrationStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewEmployee(evaluation.employeeId)}
                            className="btn-view"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReviewCard>
          </>
        )}
      </div>
    </div>
  )
}

export default CalibrationDashboardPage
