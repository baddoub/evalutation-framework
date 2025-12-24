import React from 'react'
import { BonusTier } from '../../types/performanceReviews'
import './PerformanceReviews.css'

interface BonusTierBadgeProps {
  tier: BonusTier
}

const BonusTierBadge: React.FC<BonusTierBadgeProps> = ({ tier }) => {
  return <span className={`bonus-tier-badge tier-${tier.toLowerCase()}`}>{tier}</span>
}

export default BonusTierBadge
