/**
 * BonusTier Value Object
 *
 * Responsibilities:
 * - Type-safe bonus tier enumeration
 * - Immutable after creation
 * - Derived from percentage score (≥85% = EXCEEDS, 50-84% = MEETS, <50% = BELOW)
 *
 * SOLID Principles:
 * - SRP: Only responsible for bonus tier representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class BonusTier {
  private static readonly EXCEEDS_THRESHOLD = 85
  private static readonly MEETS_THRESHOLD = 50

  private readonly _value: 'EXCEEDS' | 'MEETS' | 'BELOW'

  private constructor(value: 'EXCEEDS' | 'MEETS' | 'BELOW') {
    this._value = value
  }

  /**
   * Factory method for EXCEEDS tier (≥85%)
   * @returns EXCEEDS BonusTier instance
   */
  static readonly EXCEEDS = new BonusTier('EXCEEDS')

  /**
   * Factory method for MEETS tier (50-84%)
   * @returns MEETS BonusTier instance
   */
  static readonly MEETS = new BonusTier('MEETS')

  /**
   * Factory method for BELOW tier (<50%)
   * @returns BELOW BonusTier instance
   */
  static readonly BELOW = new BonusTier('BELOW')

  /**
   * Create BonusTier from percentage score
   * @param percentage - Percentage score (0-100)
   * @returns BonusTier instance
   */
  static fromPercentage(percentage: number): BonusTier {
    if (percentage >= this.EXCEEDS_THRESHOLD) {
      return BonusTier.EXCEEDS
    }
    if (percentage >= this.MEETS_THRESHOLD) {
      return BonusTier.MEETS
    }
    return BonusTier.BELOW
  }

  /**
   * Get bonus tier value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another BonusTier
   * @param other - BonusTier to compare with
   * @returns true if tiers are equal
   */
  equals(other: BonusTier): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * Check if tier is EXCEEDS
   * @returns true if tier is EXCEEDS
   */
  isExceeds(): boolean {
    return this._value === 'EXCEEDS'
  }

  /**
   * Check if tier is MEETS
   * @returns true if tier is MEETS
   */
  isMeets(): boolean {
    return this._value === 'MEETS'
  }

  /**
   * Check if tier is BELOW
   * @returns true if tier is BELOW
   */
  isBelow(): boolean {
    return this._value === 'BELOW'
  }

  /**
   * String representation of bonus tier
   * @returns tier value as string
   */
  toString(): string {
    return this._value
  }
}
