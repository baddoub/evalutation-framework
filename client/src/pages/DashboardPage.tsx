import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import performanceReviewsService from '../services/performanceReviewsService'
import { ReviewCycle } from '../types/performanceReviews'
import './DashboardPage.css'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)

        try {
          const cycle = await performanceReviewsService.getActiveCycle()
          setActiveCycle(cycle)
        } catch (cycleError) {
          console.log('No active cycle found')
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const hasRole = (role: string) => user?.roles.includes(role)

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Performance Evaluation System</h1>
        </div>
        <div className="nav-actions">
          <span className="user-name">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Your Dashboard</h2>
          {activeCycle ? (
            <p>
              {activeCycle.name} is currently {activeCycle.status.toLowerCase()}
            </p>
          ) : (
            <p>No active review cycle at this time</p>
          )}
        </div>

        {activeCycle && (
          <div className="info-card">
            <h3>Active Review Cycle</h3>
            <div className="profile-info">
              <div className="info-item">
                <span className="label">Cycle Name:</span>
                <span className="value">{activeCycle.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Year:</span>
                <span className="value">{activeCycle.year}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className="value">{activeCycle.status}</span>
              </div>
              <div className="info-item">
                <span className="label">Self-Review Deadline:</span>
                <span className="value">
                  {new Date(activeCycle.deadlines.selfReview).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Peer Feedback Deadline:</span>
                <span className="value">
                  {new Date(activeCycle.deadlines.peerFeedback).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="feature-status">
          <h3>Quick Actions</h3>
          <div className="status-grid">
            <div className="status-item active" onClick={() => navigate('/reviews/self-review')}>
              <div className="status-icon">📝</div>
              <div className="status-text">
                <h4>Self-Review</h4>
                <p>Complete your self-assessment</p>
              </div>
            </div>

            <div
              className="status-item active"
              onClick={() => navigate('/reviews/peer-nomination')}
            >
              <div className="status-icon">👥</div>
              <div className="status-text">
                <h4>Nominate Peers</h4>
                <p>Select your peer reviewers</p>
              </div>
            </div>

            <div className="status-item active" onClick={() => navigate('/reviews/peer-feedback')}>
              <div className="status-icon">💬</div>
              <div className="status-text">
                <h4>Peer Feedback</h4>
                <p>Provide feedback for colleagues</p>
              </div>
            </div>

            <div
              className="status-item active"
              onClick={() => navigate('/reviews/my-peer-feedback')}
            >
              <div className="status-icon">📊</div>
              <div className="status-text">
                <h4>My Peer Feedback</h4>
                <p>View feedback from peers</p>
              </div>
            </div>

            {hasRole('MANAGER') && (
              <div className="status-item active" onClick={() => navigate('/reviews/team')}>
                <div className="status-icon">👨‍💼</div>
                <div className="status-text">
                  <h4>Team Reviews</h4>
                  <p>Manage team evaluations</p>
                </div>
              </div>
            )}

            <div className="status-item active" onClick={() => navigate('/reviews/final-score')}>
              <div className="status-icon">🎯</div>
              <div className="status-text">
                <h4>Final Score</h4>
                <p>View your performance rating</p>
              </div>
            </div>

            {hasRole('HR_ADMIN') && (
              <div
                className="status-item active"
                onClick={() => navigate('/reviews/admin/cycles')}
              >
                <div className="status-icon">⚙️</div>
                <div className="status-text">
                  <h4>Admin Panel</h4>
                  <p>Manage review cycles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="label">User ID:</span>
              <span className="value">{user?.id}</span>
            </div>
            <div className="info-item">
              <span className="label">Roles:</span>
              <span className="value">{user?.roles.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
