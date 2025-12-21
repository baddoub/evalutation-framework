import { InvalidPillarScoreException } from '../exceptions/invalid-pillar-score.exception'

/**
 * PillarScore Value Object
 *
 * Responsibilities:
 * - Type-safe pillar score with 0-4 integer validation
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for pillar score validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class PillarScore {
  private readonly _value: number

  private constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new InvalidPillarScoreException(`Pillar score must be an integer, got ${value}`)
    }
    if (value < 0 || value > 4) {
      throw new InvalidPillarScoreException(`Pillar score must be between 0 and 4, got ${value}`)
    }
    this._value = value
  }

  /**
   * Create PillarScore from number
   * @param value - Score value (0-4)
   * @returns PillarScore instance
   * @throws InvalidPillarScoreException if value is invalid
   */
  static fromValue(value: number): PillarScore {
    return new PillarScore(value)
  }

  /**
   * Get pillar score value
   */
  get value(): number {
    return this._value
  }

  /**
   * Check equality with another PillarScore
   * @param other - PillarScore to compare with
   * @returns true if scores are equal
   */
  equals(other: PillarScore): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of pillar score
   * @returns score value as string
   */
  toString(): string {
    return this._value.toString()
  }
}
