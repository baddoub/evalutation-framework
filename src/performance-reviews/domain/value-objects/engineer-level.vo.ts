import { InvalidEngineerLevelException } from '../exceptions/invalid-engineer-level.exception'

/**
 * EngineerLevel Value Object
 *
 * Responsibilities:
 * - Type-safe engineer level enumeration with validation
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for engineer level validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class EngineerLevel {
  private static readonly VALID_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'] as const
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Factory method for JUNIOR level
   * @returns JUNIOR EngineerLevel instance
   */
  static readonly JUNIOR = new EngineerLevel('JUNIOR')

  /**
   * Factory method for MID level
   * @returns MID EngineerLevel instance
   */
  static readonly MID = new EngineerLevel('MID')

  /**
   * Factory method for SENIOR level
   * @returns SENIOR EngineerLevel instance
   */
  static readonly SENIOR = new EngineerLevel('SENIOR')

  /**
   * Factory method for LEAD level
   * @returns LEAD EngineerLevel instance
   */
  static readonly LEAD = new EngineerLevel('LEAD')

  /**
   * Factory method for MANAGER level
   * @returns MANAGER EngineerLevel instance
   */
  static readonly MANAGER = new EngineerLevel('MANAGER')

  /**
   * Create EngineerLevel from string
   * @param level - Level string to validate and create
   * @returns EngineerLevel instance
   * @throws InvalidEngineerLevelException if level is invalid
   */
  static fromString(level: string): EngineerLevel {
    if (!level || typeof level !== 'string') {
      throw new InvalidEngineerLevelException('Invalid engineer level: Level cannot be empty')
    }

    const trimmedLevel = level.trim().toUpperCase()

    if (!this.isValid(trimmedLevel)) {
      const validLevels = this.VALID_LEVELS.join(', ')
      throw new InvalidEngineerLevelException(
        `Invalid engineer level: ${level}. Valid levels: ${validLevels}`,
      )
    }

    return new EngineerLevel(trimmedLevel)
  }

  /**
   * Alias for fromString() - Create EngineerLevel from string
   * @param level - Level string to validate and create
   * @returns EngineerLevel instance
   * @throws InvalidEngineerLevelException if level is invalid
   */
  static create(level: string): EngineerLevel {
    return this.fromString(level)
  }

  /**
   * Validates level string
   * @param level - Level string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(level: string): boolean {
    return this.VALID_LEVELS.includes(level as any)
  }

  /**
   * Get level value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another EngineerLevel
   * @param other - EngineerLevel to compare with
   * @returns true if levels are equal
   */
  equals(other: EngineerLevel): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * Check if level is JUNIOR
   * @returns true if level is JUNIOR
   */
  isJunior(): boolean {
    return this._value === 'JUNIOR'
  }

  /**
   * Check if level is MID
   * @returns true if level is MID
   */
  isMid(): boolean {
    return this._value === 'MID'
  }

  /**
   * Check if level is SENIOR
   * @returns true if level is SENIOR
   */
  isSenior(): boolean {
    return this._value === 'SENIOR'
  }

  /**
   * Check if level is LEAD
   * @returns true if level is LEAD
   */
  isLead(): boolean {
    return this._value === 'LEAD'
  }

  /**
   * Check if level is MANAGER
   * @returns true if level is MANAGER
   */
  isManager(): boolean {
    return this._value === 'MANAGER'
  }

  /**
   * String representation of level
   * @returns level value as string
   */
  toString(): string {
    return this._value
  }
}
