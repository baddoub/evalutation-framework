import { randomUUID } from 'crypto'
import { InvalidReviewCycleIdException } from '../exceptions/invalid-review-cycle-id.exception'

/**
 * ReviewCycleId Value Object
 *
 * Responsibilities:
 * - Type-safe review cycle identifier with UUID format
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for review cycle ID validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ReviewCycleId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Generate new ReviewCycleId with UUID v4
   * @returns ReviewCycleId instance with new UUID
   */
  static generate(): ReviewCycleId {
    return new ReviewCycleId(randomUUID())
  }

  /**
   * Create ReviewCycleId from existing UUID string
   * @param id - UUID string
   * @returns ReviewCycleId instance
   * @throws InvalidReviewCycleIdException if UUID format is invalid
   */
  static fromString(id: string): ReviewCycleId {
    if (!id || typeof id !== 'string') {
      throw new InvalidReviewCycleIdException('Invalid UUID format: ID cannot be empty')
    }

    const trimmedId = id.trim().toLowerCase()

    if (!this.isValid(trimmedId)) {
      throw new InvalidReviewCycleIdException(`Invalid UUID format: ${id}`)
    }

    return new ReviewCycleId(trimmedId)
  }

  /**
   * Alias for fromString() - Create ReviewCycleId from existing UUID string
   * @param id - UUID string
   * @returns ReviewCycleId instance
   * @throws InvalidReviewCycleIdException if UUID format is invalid
   */
  static create(id: string): ReviewCycleId {
    return this.fromString(id)
  }

  /**
   * Validates UUID v4 format
   * @param id - UUID string to validate
   * @returns true if valid UUID v4, false otherwise
   */
  private static isValid(id: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidV4Regex.test(id)
  }

  /**
   * Get review cycle ID value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another ReviewCycleId
   * @param other - ReviewCycleId to compare with
   * @returns true if ReviewCycleIds are equal
   */
  equals(other: ReviewCycleId): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of ReviewCycleId
   * @returns UUID as string
   */
  toString(): string {
    return this._value
  }
}
