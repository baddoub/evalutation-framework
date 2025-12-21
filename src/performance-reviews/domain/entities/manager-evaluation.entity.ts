import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { ReviewStatus } from '../value-objects/review-status.vo'
import { ManagerEvaluationAlreadySubmittedException } from '../exceptions/manager-evaluation-already-submitted.exception'
import { Narrative } from '../value-objects/narrative.vo'
import { EngineerLevel } from '../value-objects/engineer-level.vo'
import { ManagerEvaluationId } from '../value-objects/manager-evaluation-id.vo'

// Re-export for convenience
export { ManagerEvaluationId } from '../value-objects/manager-evaluation-id.vo'

export interface CreateManagerEvaluationProps {
  id?: ManagerEvaluationId
  cycleId: ReviewCycleId
  employeeId: UserId
  managerId: UserId
  scores: PillarScores
  narrative: string
  strengths: string
  growthAreas: string
  developmentPlan: string
  employeeLevel?: EngineerLevel
  proposedLevel?: EngineerLevel
  performanceNarrative?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * ManagerEvaluation Entity
 *
 * Responsibilities:
 * - Manage manager's evaluation of employee
 * - Handle calibration adjustments
 * - Track evaluation status
 *
 * SOLID Principles:
 * - SRP: Only responsible for manager evaluation state management
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ManagerEvaluation {
  private constructor(
    private readonly _id: ManagerEvaluationId,
    private readonly _cycleId: ReviewCycleId,
    private readonly _employeeId: UserId,
    private readonly _managerId: UserId,
    private _scores: PillarScores,
    private _narrative: string,
    private _strengths: string,
    private _growthAreas: string,
    private _developmentPlan: string,
    private _status: ReviewStatus,
    private _employeeLevel?: EngineerLevel,
    private _proposedLevel?: EngineerLevel,
    private _performanceNarrative?: string,
    private _submittedAt?: Date,
    private _calibratedAt?: Date,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  /**
   * Create a new ManagerEvaluation in DRAFT status
   */
  static create(props: CreateManagerEvaluationProps): ManagerEvaluation {
    return new ManagerEvaluation(
      props.id ?? ManagerEvaluationId.generate(),
      props.cycleId,
      props.employeeId,
      props.managerId,
      props.scores,
      props.narrative,
      props.strengths,
      props.growthAreas,
      props.developmentPlan,
      ReviewStatus.DRAFT,
      props.employeeLevel,
      props.proposedLevel,
      props.performanceNarrative,
      undefined, // submittedAt
      undefined, // calibratedAt
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    )
  }

  /**
   * Update scores (only in DRAFT status)
   */
  updateScores(scores: PillarScores): void {
    if (this.isSubmitted) {
      throw new ManagerEvaluationAlreadySubmittedException('Cannot update scores after submission')
    }
    this._scores = scores
    this._updatedAt = new Date()
  }

  /**
   * Submit the evaluation
   */
  submit(): void {
    if (this.isSubmitted) {
      throw new ManagerEvaluationAlreadySubmittedException()
    }
    this._status = ReviewStatus.SUBMITTED
    this._submittedAt = new Date()
    this._updatedAt = new Date()
  }

  /**
   * Mark as calibrated
   */
  calibrate(): void {
    if (!this.isSubmitted) {
      throw new Error('Cannot calibrate evaluation that has not been submitted')
    }
    this._status = ReviewStatus.CALIBRATED
    this._calibratedAt = new Date()
    this._updatedAt = new Date()
  }

  /**
   * Apply calibration adjustment (updates scores)
   */
  applyCalibrationAdjustment(newScores: PillarScores, _justification: string): void {
    if (!this.isSubmitted) {
      throw new Error('Cannot apply calibration to unsubmitted evaluation')
    }
    this._scores = newScores
    this._updatedAt = new Date()
    this.calibrate()
  }

  /**
   * Update performance narrative (only in DRAFT status)
   */
  updatePerformanceNarrative(narrative: Narrative): void {
    if (this.isSubmitted) {
      throw new ManagerEvaluationAlreadySubmittedException('Cannot update performance narrative after submission')
    }
    this._performanceNarrative = narrative.text
    this._updatedAt = new Date()
  }

  /**
   * Update growth areas (only in DRAFT status)
   */
  updateGrowthAreas(growthAreas: Narrative): void {
    if (this.isSubmitted) {
      throw new ManagerEvaluationAlreadySubmittedException('Cannot update growth areas after submission')
    }
    this._growthAreas = growthAreas.text
    this._updatedAt = new Date()
  }

  /**
   * Update proposed level (only in DRAFT status)
   */
  updateProposedLevel(level: EngineerLevel): void {
    if (this.isSubmitted) {
      throw new ManagerEvaluationAlreadySubmittedException('Cannot update proposed level after submission')
    }
    this._proposedLevel = level
    this._updatedAt = new Date()
  }

  // Getters
  get id(): ManagerEvaluationId {
    return this._id
  }

  get cycleId(): ReviewCycleId {
    return this._cycleId
  }

  get employeeId(): UserId {
    return this._employeeId
  }

  get managerId(): UserId {
    return this._managerId
  }

  get scores(): PillarScores {
    return this._scores
  }

  get narrative(): string {
    return this._narrative
  }

  get strengths(): string {
    return this._strengths
  }

  get growthAreas(): string {
    return this._growthAreas
  }

  get developmentPlan(): string {
    return this._developmentPlan
  }

  get status(): ReviewStatus {
    return this._status
  }

  get submittedAt(): Date | undefined {
    return this._submittedAt
  }

  get calibratedAt(): Date | undefined {
    return this._calibratedAt
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get isSubmitted(): boolean {
    return this._status.equals(ReviewStatus.SUBMITTED) || this._status.equals(ReviewStatus.CALIBRATED)
  }

  get isCalibrated(): boolean {
    return this._status.equals(ReviewStatus.CALIBRATED)
  }

  get employeeLevel(): EngineerLevel | undefined {
    return this._employeeLevel
  }

  get proposedLevel(): EngineerLevel | undefined {
    return this._proposedLevel
  }

  get performanceNarrative(): string | undefined {
    return this._performanceNarrative
  }
}
