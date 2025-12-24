import type { RefreshToken } from '../entities/refresh-token.entity'
import type { UserId } from '../value-objects/user-id.vo'

/**
 * RefreshToken Repository Interface
 *
 * Defines the contract for refresh token persistence operations.
 * This interface belongs to the domain layer, but implementations
 * will be in the infrastructure layer (Dependency Inversion Principle).
 */
export interface IRefreshTokenRepository {
  /**
   * Find refresh token by unique identifier
   * @param id Token ID
   * @returns RefreshToken entity or null if not found
   */
  findById(id: string): Promise<RefreshToken | null>

  /**
   * Find refresh token by token hash
   * Used during token validation and refresh operations
   * @param hash Bcrypt hashed token value
   * @returns RefreshToken entity or null if not found
   */
  findByTokenHash(hash: string): Promise<RefreshToken | null>

  /**
   * Find all refresh tokens for a user
   * @param userId User ID
   * @returns Array of RefreshToken entities
   */
  findByUserId(userId: UserId): Promise<RefreshToken[]>

  /**
   * Save refresh token (create or update)
   * @param token RefreshToken entity to save
   * @returns Saved RefreshToken entity
   */
  save(token: RefreshToken): Promise<RefreshToken>

  /**
   * Delete refresh token
   * @param id Token ID
   */
  delete(id: string): Promise<void>

  /**
   * Delete all refresh tokens for a user
   * Used during logout and token theft detection
   * @param userId User ID
   */
  deleteAllByUserId(userId: UserId): Promise<void>

  /**
   * Delete expired and revoked tokens (cleanup job)
   * @returns Number of tokens deleted
   */
  deleteExpiredAndRevoked(): Promise<number>
}
