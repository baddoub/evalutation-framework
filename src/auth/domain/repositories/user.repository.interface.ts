import type { User } from '../entities/user.entity'
import type { Email } from '../value-objects/email.vo'
import type { UserId } from '../value-objects/user-id.vo'
import type { Role } from '../value-objects/role.vo'

/**
 * User Repository Interface
 *
 * Defines the contract for user persistence operations.
 * This interface belongs to the domain layer, but implementations
 * will be in the infrastructure layer (Dependency Inversion Principle).
 */
export interface IUserRepository {
  /**
   * Find user by unique identifier
   * @param id User ID
   * @returns User entity or null if not found
   */
  findById(id: UserId): Promise<User | null>

  /**
   * Find user by email address
   * @param email Email value object
   * @returns User entity or null if not found
   */
  findByEmail(email: Email): Promise<User | null>

  /**
   * Find user by Keycloak ID
   * @param keycloakId Keycloak user identifier
   * @returns User entity or null if not found
   */
  findByKeycloakId(keycloakId: string): Promise<User | null>

  /**
   * Save user (create or update)
   * Uses upsert pattern - creates new user if doesn't exist, updates if exists
   * @param user User entity to save
   * @returns Saved user entity
   */
  save(user: User): Promise<User>

  /**
   * Soft delete user
   * Sets deletedAt timestamp instead of removing from database
   * @param id User ID
   */
  delete(id: UserId): Promise<void>

  /**
   * Check if user with email exists
   * @param email Email value object
   * @returns True if user exists, false otherwise
   */
  existsByEmail(email: Email): Promise<boolean>

  /**
   * Find all users with a specific role
   * @param role Role value object
   * @returns Array of user entities
   */
  findByRole(role: Role): Promise<User[]>

  /**
   * Find all users managed by a specific manager
   * @param managerId Manager's user ID
   * @returns Array of user entities
   */
  findByManagerId(managerId: string): Promise<User[]>
}
