import { randomUUID } from 'crypto'
import { InvalidUserIdException } from '../exceptions/invalid-user-id.exception'

/**
 * UserId Value Object
 *
 * Responsibilities:
 * - Type-safe user identifier with UUID format
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for user ID validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class UserId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Generate new UserId with UUID v4
   * @returns UserId instance with new UUID
   */
  static generate(): UserId {
    return new UserId(randomUUID())
  }

  /**
   * Create UserId from existing UUID string
   * @param id - UUID string
   * @returns UserId instance
   * @throws InvalidUserIdException if UUID format is invalid
   */
  static fromString(id: string): UserId {
    if (!id || typeof id !== 'string') {
      throw new InvalidUserIdException('Invalid UUID format: ID cannot be empty')
    }

    const trimmedId = id.trim().toLowerCase()

    if (!this.isValid(trimmedId)) {
      throw new InvalidUserIdException(`Invalid UUID format: ${id}`)
    }

    return new UserId(trimmedId)
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
   * Get user ID value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another UserId
   * @param other - UserId to compare with
   * @returns true if UserIds are equal
   */
  equals(other: UserId): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of UserId
   * @returns UUID as string
   */
  toString(): string {
    return this._value
  }
}
