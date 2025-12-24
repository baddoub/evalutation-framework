import type { Email } from '../value-objects/email.vo'
import type { UserId } from '../value-objects/user-id.vo'
import type { Role } from '../value-objects/role.vo'
import { InvalidUserException } from '../exceptions/invalid-user.exception'

export interface UserProps {
  id: UserId
  email: Email
  name: string
  keycloakId: string
  roles: Role[]
  isActive: boolean
  level?: string | null
  department?: string | null
  jobTitle?: string | null
  managerId?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface KeycloakUserData {
  email: Email
  name: string
  roles: Role[]
}

/**
 * User Aggregate Root
 *
 * Represents an authenticated user in the system with full business logic
 * for profile management, role assignment, and Keycloak synchronization.
 */
export class User {
  private readonly _id: UserId
  private _email: Email
  private _name: string
  private readonly _keycloakId: string
  private _roles: Role[]
  private _isActive: boolean
  private _level?: string | null
  private _department?: string | null
  private _jobTitle?: string | null
  private _managerId?: string | null
  private readonly _createdAt: Date
  private _updatedAt: Date
  private _deletedAt?: Date

  private constructor(props: UserProps) {
    this._id = props.id
    this._email = props.email
    this._name = props.name
    this._keycloakId = props.keycloakId
    this._roles = props.roles
    this._isActive = props.isActive
    this._level = props.level
    this._department = props.department
    this._jobTitle = props.jobTitle
    this._managerId = props.managerId
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt
  }

  /**
   * Factory method to create a new User
   * Validates all business invariants
   */
  static create(props: UserProps): User {
    // Validate name
    User.validateName(props.name)

    // Validate keycloakId
    if (!props.keycloakId || props.keycloakId.trim().length === 0) {
      throw new InvalidUserException('Keycloak ID is required')
    }

    // Validate roles
    if (!props.roles || props.roles.length === 0) {
      throw new InvalidUserException('User must have at least one role')
    }

    return new User(props)
  }

  /**
   * Update user profile (name only)
   * Email changes must go through Keycloak synchronization
   */
  updateProfile(name: string): void {
    User.validateName(name)
    this._name = name
    this.touch()
  }

  /**
   * Assign a role to the user
   * Prevents duplicate roles
   */
  assignRole(role: Role): void {
    // Check if role already exists
    const roleExists = this._roles.some((r) => r.equals(role))
    if (roleExists) {
      return // Already has this role
    }

    this._roles.push(role)
    this.touch()
  }

  /**
   * Remove a role from the user
   * Enforces that at least one role must remain
   */
  removeRole(role: Role): void {
    // Check if role exists
    const roleExists = this._roles.some((r) => r.equals(role))
    if (!roleExists) {
      return // Role doesn't exist, nothing to remove
    }

    // Check if removing this role would leave user with no roles
    if (this._roles.length === 1) {
      throw new InvalidUserException('User must have at least one role')
    }

    this._roles = this._roles.filter((r) => !r.equals(role))
    this.touch()
  }

  /**
   * Activate user account
   */
  activate(): void {
    this._isActive = true
    this.touch()
  }

  /**
   * Deactivate user account (soft delete alternative)
   */
  deactivate(): void {
    this._isActive = false
    this.touch()
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: Role): boolean {
    return this._roles.some((r) => r.equals(role))
  }

  /**
   * Check if user has any of the given roles
   */
  hasAnyRole(roles: Role[]): boolean {
    if (!roles || roles.length === 0) {
      return false
    }
    return roles.some((role) => this.hasRole(role))
  }

  /**
   * Synchronize user data from Keycloak
   * Updates email, name, and roles while maintaining keycloakId immutability
   */
  synchronizeFromKeycloak(data: KeycloakUserData): void {
    User.validateName(data.name)

    if (!data.roles || data.roles.length === 0) {
      throw new InvalidUserException('User must have at least one role')
    }

    this._email = data.email
    this._name = data.name
    this._roles = data.roles
    this.touch()
  }

  /**
   * Update the updatedAt timestamp
   */
  private touch(): void {
    this._updatedAt = new Date()
  }

  /**
   * Validate user name
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidUserException('User name cannot be empty')
    }

    if (name.length > 100) {
      throw new InvalidUserException('Name too long (max 100 chars)')
    }
  }

  // Getters
  get id(): UserId {
    return this._id
  }

  get email(): Email {
    return this._email
  }

  get name(): string {
    return this._name
  }

  get keycloakId(): string {
    return this._keycloakId
  }

  get roles(): Role[] {
    return [...this._roles] // Return copy to prevent external modification
  }

  get isActive(): boolean {
    return this._isActive
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt
  }

  get level(): string | null | undefined {
    return this._level
  }

  get department(): string | null | undefined {
    return this._department
  }

  get jobTitle(): string | null | undefined {
    return this._jobTitle
  }

  get managerId(): string | null | undefined {
    return this._managerId
  }
}
