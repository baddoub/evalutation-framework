import { Inject, Injectable } from '@nestjs/common'
import { ITokenService } from '../../ports/token-service.interface'
import { ISessionManager } from '../../ports/session-manager.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { RefreshTokensInput } from './refresh-tokens.input'
import { RefreshTokensOutput } from './refresh-tokens.output'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { TokenExpiredException } from '../../exceptions/token-expired.exception'
import { TokenTheftDetectedException } from '../../exceptions/token-theft-detected.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'
import { UserNotFoundException } from '../../exceptions/user-not-found.exception'
import * as bcrypt from 'bcrypt'

/**
 * RefreshTokensUseCase
 *
 * Implements token refresh with rotation for enhanced security:
 * 1. Validate refresh token
 * 2. Check if token was used (rotation detection)
 * 3. Verify user exists and is active
 * 4. Mark old token as used
 * 5. Generate new token pair
 * 6. Handle token theft (reuse detection)
 *
 * Token Rotation Security:
 * - Each refresh token can only be used once
 * - Reusing a token triggers theft detection
 * - All user sessions are revoked on theft
 */
@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('ISessionManager')
    private readonly sessionManager: ISessionManager,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: RefreshTokensInput): Promise<RefreshTokensOutput> {
    // Step 1: Validate refresh token
    const tokenPayload = await this.tokenService.validateRefreshToken(input.refreshToken)

    // Step 2: Get user
    const userId = UserId.fromString(tokenPayload.sub)
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundException('User not found')
    }

    // Step 3: Check if user is active
    if (!user.isActive) {
      throw new UserDeactivatedException('User account is deactivated. Cannot refresh token.')
    }

    // Step 4: Retrieve all user's refresh tokens and find matching one
    const userTokens = await this.refreshTokenRepository.findByUserId(userId)

    // Find matching token using bcrypt.compare
    let refreshToken = null
    for (const token of userTokens) {
      const matches = await bcrypt.compare(input.refreshToken, token.tokenHash)
      if (matches) {
        refreshToken = token
        break
      }
    }

    if (!refreshToken) {
      throw new TokenExpiredException('Refresh token not found or expired')
    }

    // Step 5: Check if token was already used (theft detection)
    if (refreshToken.used) {
      // TOKEN THEFT DETECTED - Revoke all user sessions
      await this.handleTokenTheft(userId)
      throw new TokenTheftDetectedException(
        'Token reuse detected. All sessions have been revoked for security.',
      )
    }

    // Step 6: Check if token has expired
    if (refreshToken.isExpired()) {
      throw new TokenExpiredException('Refresh token has expired')
    }

    // Step 7: Mark old token as used (rotation)
    refreshToken.markAsUsed()
    await this.refreshTokenRepository.save(refreshToken)

    // Step 8: Generate new token pair
    const newTokenPair = await this.tokenService.generateTokenPair(user.id, user.roles)

    // Step 9: Persist new refresh token
    const { RefreshToken } = await import('../../../domain/entities/refresh-token.entity')
    const newRefreshToken = RefreshToken.create({
      id: UserId.generate().value,
      userId: user.id,
      tokenHash: await bcrypt.hash(newTokenPair.refreshToken, 10),
      used: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    })
    await this.refreshTokenRepository.save(newRefreshToken)

    // Step 10: Return new tokens
    return new RefreshTokensOutput(
      newTokenPair.accessToken,
      newTokenPair.refreshToken,
      newTokenPair.expiresIn,
    )
  }

  /**
   * Handle token theft by revoking all user sessions and tokens
   */
  private async handleTokenTheft(userId: UserId): Promise<void> {
    // Revoke all sessions
    await this.sessionManager.revokeAllUserSessions(userId)

    // Delete all refresh tokens
    await this.refreshTokenRepository.deleteAllByUserId(userId)
  }
}
