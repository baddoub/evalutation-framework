import { InvalidRoleException } from '../exceptions/invalid-role.exception'

/**
 * Role Value Object
 *
 * Responsibilities:
 * - Type-safe role enumeration with validation
 * - Immutable after creation
 * - Value equality support
 * - Role-based permission checking
 *
 * SOLID Principles:
 * - SRP: Only responsible for role validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class Role {
  private static readonly VALID_ROLES = ['admin', 'manager', 'user'] as const
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Create Role from string
   * @param role - Role string to validate and create
   * @returns Role instance
   * @throws InvalidRoleException if role is invalid
   */
  static create(role: string): Role {
    if (!role || typeof role !== 'string') {
      throw new InvalidRoleException('Invalid role: Role cannot be empty')
    }

    const trimmedRole = role.trim()

    if (trimmedRole.length === 0) {
      throw new InvalidRoleException('Invalid role: Role cannot be empty')
    }

    if (!this.isValid(trimmedRole)) {
      throw new InvalidRoleException(
        `Invalid role: ${role}. Valid roles: ${this.VALID_ROLES.join(', ')}`,
      )
    }

    return new Role(trimmedRole.toLowerCase())
  }

  /**
   * Factory method for admin role
   * @returns Admin Role instance
   */
  static admin(): Role {
    return new Role('admin')
  }

  /**
   * Factory method for manager role
   * @returns Manager Role instance
   */
  static manager(): Role {
    return new Role('manager')
  }

  /**
   * Factory method for user role
   * @returns User Role instance
   */
  static user(): Role {
    return new Role('user')
  }

  /**
   * Validates role string
   * @param role - Role string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(role: string): boolean {
    return this.VALID_ROLES.includes(role.toLowerCase() as any)
  }

  /**
   * Get role value
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another Role
   * @param other - Role to compare with
   * @returns true if roles are equal
   */
  equals(other: Role): boolean {
    if (!other) {
      return false
    }

    return this._value === other._value
  }

  /**
   * Check if role is admin
   * @returns true if role is admin
   */
  isAdmin(): boolean {
    return this._value === 'admin'
  }

  /**
   * String representation of role
   * @returns role value as string
   */
  toString(): string {
    return this._value
  }
}
