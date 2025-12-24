import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import type { CycleDeadlines } from '../value-objects/cycle-deadlines.vo'
import { InvalidReviewCycleStateException } from '../exceptions/invalid-review-cycle-state.exception'

/**
 * CycleStatus Value Object
 */
export class CycleStatus {
  private readonly _value: 'DRAFT' | 'ACTIVE' | 'CALIBRATION' | 'COMPLETED'

  private constructor(value: 'DRAFT' | 'ACTIVE' | 'CALIBRATION' | 'COMPLETED') {
    this._value = value
  }

  static readonly DRAFT = new CycleStatus('DRAFT')
  static readonly ACTIVE = new CycleStatus('ACTIVE')
  static readonly CALIBRATION = new CycleStatus('CALIBRATION')
  static readonly COMPLETED = new CycleStatus('COMPLETED')

  static fromString(status: string): CycleStatus {
    const upperStatus = status.toUpperCase()
    switch (upperStatus) {
      case 'DRAFT':
        return CycleStatus.DRAFT
      case 'ACTIVE':
        return CycleStatus.ACTIVE
      case 'CALIBRATION':
        return CycleStatus.CALIBRATION
      case 'COMPLETED':
        return CycleStatus.COMPLETED
      default:
        throw new Error(`Invalid cycle status: ${status}`)
    }
  }

  get value(): string {
    return this._value
  }

  equals(other: CycleStatus): boolean {
    if (!other) return false
    return this._value === other._value
  }
}

export interface CreateReviewCycleProps {
  id?: ReviewCycleId
  name: string
  year: number
  deadlines: CycleDeadlines
  startDate?: Date
}

/**
 * ReviewCycle Entity
 *
 * Responsibilities:
 * - Manage review cycle lifecycle (DRAFT → ACTIVE → CALIBRATION → COMPLETED)
 * - Enforce state transition rules
 * - Track deadlines for each phase
 *
 * SOLID Principles:
 * - SRP: Only responsible for review cycle state management
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ReviewCycle {
  private constructor(
    private readonly _id: ReviewCycleId,
    private _name: string,
    private _year: number,
    private _status: CycleStatus,
    private _deadlines: CycleDeadlines,
    private _startDate: Date,
    private _endDate?: Date,
  ) {}

  /**
   * Create a new ReviewCycle in DRAFT status
   */
  static create(props: CreateReviewCycleProps): ReviewCycle {
    return new ReviewCycle(
      props.id ?? ReviewCycleId.generate(),
      props.name,
      props.year,
      CycleStatus.DRAFT,
      props.deadlines,
      props.startDate ?? new Date(),
    )
  }

  /**
   * Start the review cycle (DRAFT → ACTIVE)
   */
  start(): void {
    if (!this._status.equals(CycleStatus.DRAFT)) {
      throw new InvalidReviewCycleStateException(
        `Cannot start cycle from ${this._status.value} status. Must be DRAFT`,
      )
    }
    this._status = CycleStatus.ACTIVE
  }

  /**
   * Alias for start() - Activate the review cycle (DRAFT → ACTIVE)
   */
  activate(): void {
    this.start()
  }

  /**
   * Enter calibration phase (ACTIVE → CALIBRATION)
   */
  enterCalibration(): void {
    if (!this._status.equals(CycleStatus.ACTIVE)) {
      throw new InvalidReviewCycleStateException(
        `Cannot enter calibration from ${this._status.value} status. Must be ACTIVE`,
      )
    }
    this._status = CycleStatus.CALIBRATION
  }

  /**
   * Complete the review cycle (CALIBRATION → COMPLETED)
   */
  complete(): void {
    if (!this._status.equals(CycleStatus.CALIBRATION)) {
      throw new InvalidReviewCycleStateException(
        `Cannot complete cycle from ${this._status.value} status. Must be CALIBRATION`,
      )
    }
    this._status = CycleStatus.COMPLETED
    this._endDate = new Date()
  }

  /**
   * Check if a specific deadline has passed
   */
  hasDeadlinePassed(
    phase: 'selfReview' | 'peerFeedback' | 'managerEvaluation' | 'calibration' | 'feedbackDelivery',
  ): boolean {
    return this._deadlines.hasPassedDeadline(phase)
  }

  // Getters
  get id(): ReviewCycleId {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get year(): number {
    return this._year
  }

  get status(): CycleStatus {
    return this._status
  }

  get deadlines(): CycleDeadlines {
    return this._deadlines
  }

  get startDate(): Date {
    return this._startDate
  }

  get endDate(): Date | undefined {
    return this._endDate
  }

  get isActive(): boolean {
    return this._status.equals(CycleStatus.ACTIVE)
  }

  get isCompleted(): boolean {
    return this._status.equals(CycleStatus.COMPLETED)
  }
}
