import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { WeightedScore } from '../value-objects/weighted-score.vo'
import { BonusTier } from '../value-objects/bonus-tier.vo'
import { EngineerLevel } from '../value-objects/engineer-level.vo'
import { FinalScoreId } from '../value-objects/final-score-id.vo'
import { FinalScoreLockedException } from '../exceptions/final-score-locked.exception'

// Re-export FinalScoreId for convenience
export { FinalScoreId } from '../value-objects/final-score-id.vo'

export interface CreateFinalScoreProps {
  id?: FinalScoreId
  cycleId: ReviewCycleId
  userId: UserId
  pillarScores: PillarScores
  weightedScore: WeightedScore
  finalLevel: EngineerLevel
  peerAverageScores?: PillarScores
  peerFeedbackCount?: number
  calculatedAt?: Date
  feedbackNotes?: string
  deliveredAt?: Date
  deliveredBy?: UserId
}

/**
 * FinalScore Entity
 *
 * Responsibilities:
 * - Store final calculated scores
 * - Track peer feedback aggregation
 * - Handle locking/unlocking of scores
 * - Track feedback delivery status
 *
 * SOLID Principles:
 * - SRP: Only responsible for final score state management
 * - Domain Layer: Zero dependencies on frameworks
 */
export class FinalScore {
  private constructor(
    private readonly _id: FinalScoreId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _userId: UserId,
    private _pillarScores: PillarScores,
    private _weightedScore: WeightedScore,
    private _finalLevel: EngineerLevel,
    private _peerAverageScores: PillarScores | null,
    private _peerFeedbackCount: number,
    private _locked: boolean,
    private _lockedAt?: Date,
    private _feedbackDelivered: boolean = false,
    private _feedbackDeliveredAt?: Date,
    private _calculatedAt: Date = new Date(),
    private _feedbackNotes?: string,
    private _deliveredAt?: Date,
    private _deliveredBy?: UserId,
  ) {}

  /**
   * Create a new FinalScore
   */
  static create(props: CreateFinalScoreProps): FinalScore {
    return new FinalScore(
      props.id ?? FinalScoreId.generate(),
      props.cycleId,
      props.userId,
      props.pillarScores,
      props.weightedScore,
      props.finalLevel,
      props.peerAverageScores ?? null,
      props.peerFeedbackCount ?? 0,
      false, // not locked initially
      undefined, // lockedAt
      false, // feedbackDelivered
      undefined, // feedbackDeliveredAt
      props.calculatedAt ?? new Date(),
      props.feedbackNotes,
      props.deliveredAt,
      props.deliveredBy,
    )
  }

  /**
   * Lock the final score
   */
  lock(): void {
    if (this._locked) {
      return
    }
    this._locked = true
    this._lockedAt = new Date()
  }

  /**
   * Unlock the final score (admin only)
   */
  unlock(): void {
    if (!this._locked) {
      return
    }
    this._locked = false
    this._lockedAt = undefined
  }

  /**
   * Update scores (only when unlocked)
   */
  updateScores(pillarScores: PillarScores, weightedScore: WeightedScore): void {
    if (this._locked) {
      throw new FinalScoreLockedException('Cannot update scores when final score is locked')
    }
    this._pillarScores = pillarScores
    this._weightedScore = weightedScore
  }

  /**
   * Mark feedback as delivered
   */
  markFeedbackDelivered(deliveredBy: UserId, feedbackNotes?: string): void {
    this._feedbackDelivered = true
    this._feedbackDeliveredAt = new Date()
    this._deliveredAt = new Date()
    this._deliveredBy = deliveredBy
    if (feedbackNotes) {
      this._feedbackNotes = feedbackNotes
    }
  }

  // Getters
  get id(): FinalScoreId {
    return this._id
  }

  get cycleId(): ReviewCycleId {
    return this._cycleId
  }

  get userId(): UserId {
    return this._userId
  }

  get pillarScores(): PillarScores {
    return this._pillarScores
  }

  get weightedScore(): WeightedScore {
    return this._weightedScore
  }

  get percentageScore(): number {
    return this._weightedScore.percentage
  }

  get bonusTier(): BonusTier {
    return this._weightedScore.bonusTier
  }

  get peerAverageScores(): PillarScores | null {
    return this._peerAverageScores
  }

  get peerFeedbackCount(): number {
    return this._peerFeedbackCount
  }

  get isLocked(): boolean {
    return this._locked
  }

  get lockedAt(): Date | undefined {
    return this._lockedAt
  }

  get feedbackDelivered(): boolean {
    return this._feedbackDelivered
  }

  get feedbackDeliveredAt(): Date | undefined {
    return this._feedbackDeliveredAt
  }

  get finalLevel(): EngineerLevel {
    return this._finalLevel
  }

  get calculatedAt(): Date {
    return this._calculatedAt
  }

  get feedbackNotes(): string | undefined {
    return this._feedbackNotes
  }

  get deliveredAt(): Date | undefined {
    return this._deliveredAt
  }

  get deliveredBy(): UserId | undefined {
    return this._deliveredBy
  }

  // Aliases for compatibility with use cases
  get employeeId(): UserId {
    return this._userId
  }

  get finalScores(): PillarScores {
    return this._pillarScores
  }
}
