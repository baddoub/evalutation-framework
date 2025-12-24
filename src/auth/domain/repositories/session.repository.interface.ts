import type { Session } from '../entities/session.entity'
import type { UserId } from '../value-objects/user-id.vo'

/**
 * Session Repository Interface
 *
 * Defines the contract for session persistence operations.
 * This interface belongs to the domain layer, but implementations
 * will be in the infrastructure layer (Dependency Inversion Principle).
 */
export interface ISessionRepository {
  /**
   * Find session by unique identifier
   * @param id Session ID
   * @returns Session entity or null if not found
   */
  findById(id: string): Promise<Session | null>

  /**
   * Find all sessions for a user
   * @param userId User ID
   * @returns Array of Session entities
   */
  findByUserId(userId: UserId): Promise<Session[]>

  /**
   * Find active (non-expired) sessions for a user
   * @param userId User ID
   * @returns Array of active Session entities
   */
  findActiveByUserId(userId: UserId): Promise<Session[]>

  /**
   * Save session (create or update)
   * @param session Session entity to save
   * @returns Saved Session entity
   */
  save(session: Session): Promise<Session>

  /**
   * Delete session
   * @param id Session ID
   */
  delete(id: string): Promise<void>

  /**
   * Delete all sessions for a user
   * Used during logout
   * @param userId User ID
   */
  deleteAllByUserId(userId: UserId): Promise<void>

  /**
   * Delete expired sessions (cleanup job)
   * @returns Number of sessions deleted
   */
  deleteExpired(): Promise<number>
}
