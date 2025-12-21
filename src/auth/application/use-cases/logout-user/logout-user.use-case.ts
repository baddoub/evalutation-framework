import { Inject, Injectable } from '@nestjs/common'
import { ISessionManager } from '../../ports/session-manager.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { LogoutUserInput } from './logout-user.input'

/**
 * LogoutUserUseCase
 *
 * Implements user logout workflow:
 * 1. Revoke all user sessions
 * 2. Delete all refresh tokens
 *
 * This ensures complete cleanup of user authentication state.
 */
@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject('ISessionManager')
    private readonly sessionManager: ISessionManager,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LogoutUserInput): Promise<void> {
    // Step 1: Revoke all user sessions
    await this.sessionManager.revokeAllUserSessions(input.userId)

    // Step 2: Delete all refresh tokens
    await this.refreshTokenRepository.deleteAllByUserId(input.userId)
  }
}
