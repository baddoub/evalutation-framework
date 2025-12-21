import { InvalidEmailException } from '../exceptions/invalid-email.exception'

/**
 * Email Value Object
 *
 * Responsibilities:
 * - Ensure email format is always valid
 * - Immutable (cannot be changed after creation)
 * - Value equality (two emails with same value are equal)
 *
 * SOLID Principles:
 * - SRP: Only responsible for email validation and representation
 * - Domain Layer: Zero dependencies on frameworks or infrastructure
 */
export class Email {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Factory method to create Email value object
   * @param email - Email string to validate and create
   * @returns Email instance
   * @throws InvalidEmailException if email format is invalid
   */
  static create(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw new InvalidEmailException('Invalid email format: Email cannot be empty')
    }

    const trimmedEmail = email.trim()

    if (trimmedEmail.length === 0) {
      throw new InvalidEmailException('Invalid email format: Email cannot be empty')
    }

    if (!this.isValid(trimmedEmail)) {
      throw new InvalidEmailException(`Invalid email format: ${email}`)
    }

    return new Email(trimmedEmail.toLowerCase())
  }

  /**
   * Validates email format using regex
   * @param email - Email string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(email: string): boolean {
    // Standard email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Get email value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another Email value object
   * @param other - Email to compare with
   * @returns true if emails are equal
   */
  equals(other: Email): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * String representation of email
   * @returns email value as string
   */
  toString(): string {
    return this._value
  }
}
