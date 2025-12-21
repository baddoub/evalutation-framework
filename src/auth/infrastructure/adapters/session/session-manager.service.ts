import { Injectable, Inject } from '@nestjs/common'
import {
  ISessionManager,
  CreateSessionDto,
  UpdateSessionDto,
} from '../../../application/ports/session-manager.interface'
import { Session } from '../../../domain/entities/session.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { ISessionRepository } from '../../../domain/repositories/session.repository.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { ITokenService } from '../../../application/ports/token-service.interface'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcrypt'

/**
 * SessionManagerService
 *
 * Implementation of ISessionManager
 * Coordinates session and refresh token management
 */
@Injectable()
export class SessionManagerService implements ISessionManager {
  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Create a new user session
   */
  async createSession(data: CreateSessionDto): Promise<Session> {
    const session = Session.create({
      id: randomUUID(),
      userId: data.userId,
      deviceId: data.deviceId ?? null,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      lastUsed: new Date(),
    })

    return await this.sessionRepository.save(session)
  }

  /**
   * Find session by refresh token
   * This requires looking up the refresh token first, then the session
   */
  async findByRefreshToken(token: string): Promise<Session | null> {
    // Decode token to get user ID (without validation)
    const payload = this.tokenService.decodeToken(token)
    const userId = UserId.fromString(payload.sub)

    // Get all user's refresh tokens
    const userTokens = await this.refreshTokenRepository.findByUserId(userId)

    // Find matching token using bcrypt.compare
    let matchingToken = null
    for (const refreshToken of userTokens) {
      const matches = await bcrypt.compare(token, refreshToken.tokenHash)
      if (matches) {
        matchingToken = refreshToken
        break
      }
    }

    if (!matchingToken) {
      return null
    }

    // Find associated sessions for user (we don't have direct session-token link)
    const sessions = await this.sessionRepository.findByUserId(userId)

    // Return most recent active session
    return sessions.length > 0 ? sessions[0] : null
  }

  /**
   * Mark refresh token as used (token rotation)
   */
  async markTokenAsUsed(token: string): Promise<void> {
    // Decode token to get user ID (without validation)
    const payload = this.tokenService.decodeToken(token)
    const userId = UserId.fromString(payload.sub)

    // Get all user's refresh tokens
    const userTokens = await this.refreshTokenRepository.findByUserId(userId)

    // Find matching token using bcrypt.compare
    for (const refreshToken of userTokens) {
      const matches = await bcrypt.compare(token, refreshToken.tokenHash)
      if (matches) {
        refreshToken.markAsUsed()
        await this.refreshTokenRepository.save(refreshToken)
        return
      }
    }
  }

  /**
   * Update session information
   */
  async updateSession(data: UpdateSessionDto): Promise<void> {
    const session = await this.sessionRepository.findById(data.sessionId)

    if (session) {
      if (data.lastUsed) {
        session.updateLastUsed()
      }

      await this.sessionRepository.save(session)
    }
  }

  /**
   * Revoke all sessions for a user (logout all devices)
   */
  async revokeAllUserSessions(userId: UserId): Promise<void> {
    // Delete all refresh tokens
    await this.refreshTokenRepository.deleteAllByUserId(userId)

    // Delete all sessions
    const sessions = await this.sessionRepository.findByUserId(userId)
    for (const session of sessions) {
      await this.sessionRepository.delete(session.id)
    }
  }

  /**
   * Find all active sessions for a user
   */
  async findActiveSessions(userId: UserId): Promise<Session[]> {
    const sessions = await this.sessionRepository.findByUserId(userId)

    // Filter out expired sessions
    return sessions.filter((session) => !session.isExpired())
  }
}
