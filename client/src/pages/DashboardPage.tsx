import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import performanceReviewsService from '../services/performanceReviewsService'
import { ReviewCycle } from '../types/performanceReviews'
import './DashboardPage.css'

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth()
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchActiveCycle = async () => {
      try {
        const cycle = await performanceReviewsService.getActiveCycle()
        setActiveCycle(cycle)
      } catch (cycleError) {
        console.log('No active cycle found')
      }
    }

    if (user) {
      fetchActiveCycle()
    }
  }, [user])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="dashboard-container">
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

        <div className="info-card">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{user.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="label">User ID:</span>
              <span className="value">{user.id}</span>
            </div>
            <div className="info-item">
              <span className="label">Roles:</span>
              <span className="value">{user.roles.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
