import type { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { PeerFeedbackId } from '../value-objects/peer-feedback-id.vo'
import type { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import type { PillarScores } from '../value-objects/pillar-scores.vo'

export interface CreatePeerFeedbackProps {
  id?: PeerFeedbackId
  cycleId: ReviewCycleId
  revieweeId: UserId
  reviewerId: UserId
  scores: PillarScores
  strengths?: string
  growthAreas?: string
  generalComments?: string
}

/**
 * PeerFeedback Entity
 *
 * Responsibilities:
 * - Store peer feedback for a reviewee
 * - Always anonymized from reviewee's perspective
 * - Manage scores and comments
 *
 * SOLID Principles:
 * - SRP: Only responsible for peer feedback data
 * - Domain Layer: Zero dependencies on frameworks
 */
export class PeerFeedback {
  private constructor(
    private readonly _id: PeerFeedbackId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _revieweeId: UserId,
    private readonly _reviewerId: UserId,
    private _scores: PillarScores,
    private _strengths?: string,
    private _growthAreas?: string,
    private _generalComments?: string,
    private _submittedAt?: Date,
  ) {}

  /**
   * Create a new PeerFeedback
   */
  static create(props: CreatePeerFeedbackProps): PeerFeedback {
    return new PeerFeedback(
      props.id ?? PeerFeedbackId.generate(),
      props.cycleId,
      props.revieweeId,
      props.reviewerId,
      props.scores,
      props.strengths,
      props.growthAreas,
      props.generalComments,
      new Date(),
    )
  }

  // Getters
  get id(): PeerFeedbackId {
    return this._id
  }

  get cycleId(): ReviewCycleId {
    return this._cycleId
  }

  get revieweeId(): UserId {
    return this._revieweeId
  }

  get reviewerId(): UserId {
    return this._reviewerId
  }

  get scores(): PillarScores {
    return this._scores
  }

  get strengths(): string | undefined {
    return this._strengths
  }

  get growthAreas(): string | undefined {
    return this._growthAreas
  }

  get generalComments(): string | undefined {
    return this._generalComments
  }

  get submittedAt(): Date | undefined {
    return this._submittedAt
  }

  /**
   * Always true - peer feedback is always anonymized from reviewee's perspective
   */
  get isAnonymized(): boolean {
    return true
  }
}
