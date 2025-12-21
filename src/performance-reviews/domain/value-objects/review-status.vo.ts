/**
 * ReviewStatus Value Object
 *
 * Responsibilities:
 * - Type-safe review status enumeration
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for review status representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ReviewStatus {
  private readonly _value: 'DRAFT' | 'SUBMITTED' | 'CALIBRATED'

  private constructor(value: 'DRAFT' | 'SUBMITTED' | 'CALIBRATED') {
    this._value = value
  }

  /**
   * Factory method for DRAFT status
   * @returns DRAFT ReviewStatus instance
   */
  static readonly DRAFT = new ReviewStatus('DRAFT')

  /**
   * Factory method for SUBMITTED status
   * @returns SUBMITTED ReviewStatus instance
   */
  static readonly SUBMITTED = new ReviewStatus('SUBMITTED')

  /**
   * Factory method for CALIBRATED status
   * @returns CALIBRATED ReviewStatus instance
   */
  static readonly CALIBRATED = new ReviewStatus('CALIBRATED')

  /**
   * Create ReviewStatus from string
   * @param status - Status string
   * @returns ReviewStatus instance
   */
  static fromString(status: string): ReviewStatus {
    const upperStatus = status.toUpperCase()
    switch (upperStatus) {
      case 'DRAFT':
        return ReviewStatus.DRAFT
      case 'SUBMITTED':
        return ReviewStatus.SUBMITTED
      case 'CALIBRATED':
        return ReviewStatus.CALIBRATED
      default:
        throw new Error(`Invalid review status: ${status}`)
    }
  }

  /**
   * Get status value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another ReviewStatus
   * @param other - ReviewStatus to compare with
   * @returns true if statuses are equal
   */
  equals(other: ReviewStatus): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of review status
   * @returns status value as string
   */
  toString(): string {
    return this._value
  }
}
