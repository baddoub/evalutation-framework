import React, { useState, useEffect } from 'react'
import './PerformanceReviews.css'

interface NarrativeInputProps {
  value: string
  onChange: (value: string) => void
  maxWords?: number
  placeholder?: string
  disabled?: boolean
}

const NarrativeInput: React.FC<NarrativeInputProps> = ({
  value,
  onChange,
  maxWords = 1000,
  placeholder = 'Describe your accomplishments...',
  disabled = false,
}) => {
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter((word) => word.length > 0)
    setWordCount(words.length)
  }, [value])

  const isOverLimit = wordCount > maxWords

  return (
    <div className="narrative-input">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`narrative-textarea ${isOverLimit ? 'over-limit' : ''}`}
      />
      <div className={`word-counter ${isOverLimit ? 'over-limit' : ''}`}>
        {wordCount} / {maxWords} words
      </div>
    </div>
  )
}

export default NarrativeInput
