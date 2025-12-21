/**
 * Port interface for session management
 *
 * This interface defines the contract for managing user sessions
 * and refresh token lifecycle.
 */

import { UserId } from '../../domain/value-objects/user-id.vo'
import { Session } from '../../domain/entities/session.entity'

export interface CreateSessionDto {
  userId: UserId
  deviceId?: string
  userAgent?: string
  ipAddress?: string
  expiresAt: Date
}

export interface UpdateSessionDto {
  sessionId: string
  lastUsed?: Date
  expiresAt?: Date
}

export interface ISessionManager {
  /**
   * Create a new user session
   *
   * @param data - Session creation data
   * @returns Created session entity
   */
  createSession(data: CreateSessionDto): Promise<Session>

  /**
   * Find session by refresh token
   *
   * @param token - Refresh token
   * @returns Session entity or null if not found
   */
  findByRefreshToken(token: string): Promise<Session | null>

  /**
   * Mark refresh token as used (token rotation)
   *
   * @param token - Refresh token to mark as used
   */
  markTokenAsUsed(token: string): Promise<void>

  /**
   * Update session information
   *
   * @param data - Session update data
   */
  updateSession(data: UpdateSessionDto): Promise<void>

  /**
   * Revoke all sessions for a user (logout all devices)
   *
   * @param userId - User identifier
   */
  revokeAllUserSessions(userId: UserId): Promise<void>

  /**
   * Find all active sessions for a user
   *
   * @param userId - User identifier
   * @returns List of active sessions
   */
  findActiveSessions(userId: UserId): Promise<Session[]>
}
