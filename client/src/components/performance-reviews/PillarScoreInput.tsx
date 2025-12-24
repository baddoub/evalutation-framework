import React from 'react'
import './PerformanceReviews.css'

interface PillarScoreInputProps {
  pillar: string
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const scoreLabels = ['Does Not Meet', 'Partially Meets', 'Meets', 'Exceeds', 'Greatly Exceeds']

const PillarScoreInput: React.FC<PillarScoreInputProps> = ({
  pillar,
  label,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="pillar-score-input">
      <label className="pillar-label">{label}</label>
      <div className="score-options">
        {[0, 1, 2, 3, 4].map((score) => (
          <button
            key={score}
            type="button"
            className={`score-option ${value === score ? 'selected' : ''} score-${score}`}
            onClick={() => onChange(score)}
            disabled={disabled}
          >
            <div className="score-number">{score}</div>
            <div className="score-label">{scoreLabels[score]}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PillarScoreInput
