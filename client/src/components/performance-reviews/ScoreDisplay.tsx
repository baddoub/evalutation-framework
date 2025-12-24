import React from 'react'
import { PillarScores } from '../../types/performanceReviews'
import './PerformanceReviews.css'

interface ScoreDisplayProps {
  scores: PillarScores
  showAverage?: boolean
}

const pillarLabels: Record<keyof PillarScores, string> = {
  projectImpact: 'Project Impact',
  direction: 'Direction',
  engineeringExcellence: 'Engineering Excellence',
  operationalOwnership: 'Operational Ownership',
  peopleImpact: 'People Impact',
}

const scoreLabels = ['Does Not Meet', 'Partially Meets', 'Meets', 'Exceeds', 'Greatly Exceeds']

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores, showAverage = false }) => {
  const average =
    (scores.projectImpact +
      scores.direction +
      scores.engineeringExcellence +
      scores.operationalOwnership +
      scores.peopleImpact) /
    5

  return (
    <div className="score-display">
      {Object.entries(scores).map(([pillar, score]) => (
        <div key={pillar} className="score-row">
          <div className="score-pillar-name">
            {pillarLabels[pillar as keyof PillarScores]}
          </div>
          <div className="score-visual">
            <div className="score-bar">
              <div
                className={`score-fill score-${score}`}
                style={{ width: `${(score / 4) * 100}%` }}
              />
            </div>
            <div className="score-value">
              {score} - {scoreLabels[score]}
            </div>
          </div>
        </div>
      ))}
      {showAverage && (
        <div className="score-row average-row">
          <div className="score-pillar-name">Average</div>
          <div className="score-visual">
            <div className="score-value average-value">{average.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScoreDisplay
