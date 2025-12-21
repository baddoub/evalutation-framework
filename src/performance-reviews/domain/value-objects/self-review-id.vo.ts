import { randomUUID } from 'crypto'

/**
 * SelfReviewId Value Object
 *
 * Represents a unique identifier for a self-review.
 * Uses UUID v4 for globally unique IDs.
 */
export class SelfReviewId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Generate a new random SelfReviewId
   */
  static generate(): SelfReviewId {
    return new SelfReviewId(randomUUID())
  }

  /**
   * Create SelfReviewId from existing string value
   */
  static fromString(id: string): SelfReviewId {
    return new SelfReviewId(id)
  }

  /**
   * Get the string value of the ID
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another SelfReviewId
   */
  equals(other: SelfReviewId): boolean {
    if (!other) return false
    return this._value === other._value
  }
}
