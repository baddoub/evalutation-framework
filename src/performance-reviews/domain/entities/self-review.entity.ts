import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { SelfReviewId } from '../value-objects/self-review-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { Narrative } from '../value-objects/narrative.vo'
import { ReviewStatus } from '../value-objects/review-status.vo'
import { SelfReviewAlreadySubmittedException } from '../exceptions/self-review-already-submitted.exception'

export interface CreateSelfReviewProps {
  id?: SelfReviewId
  cycleId: ReviewCycleId
  userId: UserId
  scores: PillarScores
  narrative: Narrative
}

/**
 * SelfReview Entity
 *
 * Responsibilities:
 * - Manage self-review data (scores and narrative)
 * - Handle submission workflow
 * - Track review status
 *
 * SOLID Principles:
 * - SRP: Only responsible for self-review state management
 * - Domain Layer: Zero dependencies on frameworks
 */
export class SelfReview {
  private constructor(
    private readonly _id: SelfReviewId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _userId: UserId,
    private _scores: PillarScores,
    private _narrative: Narrative,
    private _status: ReviewStatus,
    private _submittedAt?: Date,
  ) {}

  /**
   * Create a new SelfReview in DRAFT status
   */
  static create(props: CreateSelfReviewProps): SelfReview {
    return new SelfReview(
      props.id ?? SelfReviewId.generate(),
      props.cycleId,
      props.userId,
      props.scores,
      props.narrative,
      ReviewStatus.DRAFT,
    )
  }

  /**
   * Update scores (only in DRAFT status)
   */
  updateScores(scores: PillarScores): void {
    if (this.isSubmitted) {
      throw new SelfReviewAlreadySubmittedException('Cannot update scores after submission')
    }
    this._scores = scores
  }

  /**
   * Update narrative (only in DRAFT status)
   */
  updateNarrative(narrative: Narrative): void {
    if (this.isSubmitted) {
      throw new SelfReviewAlreadySubmittedException('Cannot update narrative after submission')
    }
    this._narrative = narrative
  }

  /**
   * Submit the self-review
   */
  submit(): void {
    if (this.isSubmitted) {
      throw new SelfReviewAlreadySubmittedException()
    }
    this._status = ReviewStatus.SUBMITTED
    this._submittedAt = new Date()
  }

  // Getters
  get id(): SelfReviewId {
    return this._id
  }

  get cycleId(): ReviewCycleId {
    return this._cycleId
  }

  get userId(): UserId {
    return this._userId
  }

  get scores(): PillarScores {
    return this._scores
  }

  get narrative(): Narrative {
    return this._narrative
  }

  get status(): ReviewStatus {
    return this._status
  }

  get submittedAt(): Date | undefined {
    return this._submittedAt
  }

  get isSubmitted(): boolean {
    return this._status.equals(ReviewStatus.SUBMITTED) || this._status.equals(ReviewStatus.CALIBRATED)
  }
}
