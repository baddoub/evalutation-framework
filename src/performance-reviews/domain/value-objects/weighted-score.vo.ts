import { InvalidWeightedScoreException } from '../exceptions/invalid-weighted-score.exception'
import { BonusTier } from './bonus-tier.vo'

/**
 * WeightedScore Value Object
 *
 * Responsibilities:
 * - Type-safe weighted score with 0-4 float validation
 * - Calculate percentage (0-100)
 * - Determine bonus tier
 * - Immutable after creation
 *
 * SOLID Principles:
 * - SRP: Only responsible for weighted score validation and calculations
 * - Domain Layer: Zero dependencies on frameworks
 */
export class WeightedScore {
  private readonly _value: number

  private constructor(value: number) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      throw new InvalidWeightedScoreException(`Weighted score must be a valid number, got ${value}`)
    }
    if (value < 0 || value > 4) {
      throw new InvalidWeightedScoreException(`Weighted score must be between 0 and 4, got ${value}`)
    }
    this._value = value
  }

  /**
   * Create WeightedScore from number
   * @param value - Score value (0-4)
   * @returns WeightedScore instance
   * @throws InvalidWeightedScoreException if value is invalid
   */
  static fromValue(value: number): WeightedScore {
    return new WeightedScore(value)
  }

  /**
   * Get weighted score value
   */
  get value(): number {
    return this._value
  }

  /**
   * Get percentage representation (0-100)
   * @returns Percentage score
   */
  get percentage(): number {
    return (this._value / 4.0) * 100
  }

  /**
   * Get bonus tier based on percentage
   * @returns BonusTier instance
   */
  get bonusTier(): BonusTier {
    return BonusTier.fromPercentage(this.percentage)
  }

  /**
   * Check equality with another WeightedScore
   * @param other - WeightedScore to compare with
   * @returns true if scores are equal
   */
  equals(other: WeightedScore): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of weighted score
   * @returns score value as string
   */
  toString(): string {
    return this._value.toString()
  }
}
