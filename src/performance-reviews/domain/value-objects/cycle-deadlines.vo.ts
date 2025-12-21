import { InvalidCycleDeadlinesException } from '../exceptions/invalid-cycle-deadlines.exception'

/**
 * CycleDeadlines Value Object
 *
 * Responsibilities:
 * - Container for all 5 phase deadlines
 * - Validates deadlines are in correct order
 * - Immutable after creation
 *
 * SOLID Principles:
 * - SRP: Only responsible for containing and validating deadline dates
 * - Domain Layer: Zero dependencies on frameworks
 */
export class CycleDeadlines {
  private constructor(
    private readonly _selfReview: Date,
    private readonly _peerFeedback: Date,
    private readonly _managerEvaluation: Date,
    private readonly _calibration: Date,
    private readonly _feedbackDelivery: Date,
  ) {
    this.validateDeadlineOrder()
  }

  /**
   * Create CycleDeadlines from individual dates
   * @param deadlines - Object containing all 5 deadline dates
   * @returns CycleDeadlines instance
   * @throws InvalidCycleDeadlinesException if deadlines are not in chronological order
   */
  static create(deadlines: {
    selfReview: Date
    peerFeedback: Date
    managerEvaluation: Date
    calibration: Date
    feedbackDelivery: Date
  }): CycleDeadlines {
    return new CycleDeadlines(
      deadlines.selfReview,
      deadlines.peerFeedback,
      deadlines.managerEvaluation,
      deadlines.calibration,
      deadlines.feedbackDelivery,
    )
  }

  /**
   * Validate that deadlines are in chronological order
   * @throws InvalidCycleDeadlinesException if order is invalid
   */
  private validateDeadlineOrder(): void {
    const deadlines = [
      { name: 'Self Review', date: this._selfReview },
      { name: 'Peer Feedback', date: this._peerFeedback },
      { name: 'Manager Evaluation', date: this._managerEvaluation },
      { name: 'Calibration', date: this._calibration },
      { name: 'Feedback Delivery', date: this._feedbackDelivery },
    ]

    for (let i = 1; i < deadlines.length; i++) {
      const currentDeadline = deadlines[i]
      const previousDeadline = deadlines[i - 1]
      if (currentDeadline.date <= previousDeadline.date) {
        throw new InvalidCycleDeadlinesException(
          `${currentDeadline.name} deadline must be after ${previousDeadline.name} deadline`,
        )
      }
    }
  }

  /**
   * Get self review deadline
   */
  get selfReview(): Date {
    return this._selfReview
  }

  /**
   * Get peer feedback deadline
   */
  get peerFeedback(): Date {
    return this._peerFeedback
  }

  /**
   * Get manager evaluation deadline
   */
  get managerEvaluation(): Date {
    return this._managerEvaluation
  }

  /**
   * Get calibration deadline
   */
  get calibration(): Date {
    return this._calibration
  }

  /**
   * Get feedback delivery deadline
   */
  get feedbackDelivery(): Date {
    return this._feedbackDelivery
  }

  /**
   * Check if a specific deadline has passed
   * @param phase - Phase name
   * @returns true if deadline has passed
   */
  hasPassedDeadline(phase: 'selfReview' | 'peerFeedback' | 'managerEvaluation' | 'calibration' | 'feedbackDelivery'): boolean {
    const now = new Date()
    const deadline = this[phase]
    return now > deadline
  }

  /**
   * Convert to plain object
   * @returns Object with all deadlines
   */
  toObject(): {
    selfReview: Date
    peerFeedback: Date
    managerEvaluation: Date
    calibration: Date
    feedbackDelivery: Date
  } {
    return {
      selfReview: this._selfReview,
      peerFeedback: this._peerFeedback,
      managerEvaluation: this._managerEvaluation,
      calibration: this._calibration,
      feedbackDelivery: this._feedbackDelivery,
    }
  }
}
