import React from 'react'
import './PerformanceReviews.css'

interface ProgressBarProps {
  phases: Array<{
    name: string
    status: 'completed' | 'active' | 'upcoming'
    deadline: string
  }>
}

const ProgressBar: React.FC<ProgressBarProps> = ({ phases }) => {
  return (
    <div className="progress-bar">
      {phases.map((phase, index) => (
        <div key={index} className={`progress-phase phase-${phase.status}`}>
          <div className="phase-indicator">
            <div className="phase-dot" />
            {index < phases.length - 1 && <div className="phase-line" />}
          </div>
          <div className="phase-content">
            <div className="phase-name">{phase.name}</div>
            <div className="phase-deadline">{phase.deadline}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProgressBar
