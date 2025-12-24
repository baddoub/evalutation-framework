import React from 'react'
import './PerformanceReviews.css'

interface ReviewCardProps {
  title: string
  status?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  title,
  status,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`review-card ${className}`}>
      <div className="review-card-header">
        <h3 className="review-card-title">{title}</h3>
        {status && <span className="review-card-status">{status}</span>}
      </div>
      <div className="review-card-body">{children}</div>
      {footer && <div className="review-card-footer">{footer}</div>}
    </div>
  )
}

export default ReviewCard
