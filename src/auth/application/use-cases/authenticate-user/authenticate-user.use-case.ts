import { Inject, Injectable } from '@nestjs/common'
import { IKeycloakAdapter } from '../../ports/keycloak-adapter.interface'
import { ITokenService } from '../../ports/token-service.interface'
import { ISessionManager } from '../../ports/session-manager.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { AuthenticateUserInput } from './authenticate-user.input'
import { AuthenticateUserOutput } from './authenticate-user.output'
import { User } from '../../../domain/entities/user.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Email } from '../../../domain/value-objects/email.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { UserDto } from '../../dto/user.dto'
import { AuthenticationFailedException } from '../../exceptions/authentication-failed.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'
import * as bcrypt from 'bcrypt'

/**
 * AuthenticateUserUseCase
 *
 * Orchestrates the OAuth authentication workflow:
 * 1. Exchange authorization code for Keycloak tokens
 * 2. Validate token and extract user info
 * 3. Find or create user in local database
 * 4. Generate application tokens
 * 5. Create session record
 * 6. Return authentication result
 *
 * This use case follows Clean Architecture principles:
 * - Depends on abstractions (ports), not implementations
 * - Contains application-level business logic
 * - Orchestrates domain entities and services
 */
@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject('IKeycloakAdapter')
    private readonly keycloakAdapter: IKeycloakAdapter,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('ISessionManager')
    private readonly sessionManager: ISessionManager,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    try {
      // Step 1: Exchange authorization code for Keycloak tokens
      const keycloakTokens = await this.keycloakAdapter.exchangeCodeForTokens(
        input.authorizationCode,
        input.codeVerifier,
      )

      // Step 2: Validate Keycloak token and extract user info
      const keycloakUserInfo = await this.keycloakAdapter.validateToken(keycloakTokens.accessToken)

      // Step 3: Find or create user
      let user = await this.userRepository.findByKeycloakId(keycloakUserInfo.sub)

      if (!user) {
        // Create new user
        user = User.create({
          id: UserId.generate(),
          email: Email.create(keycloakUserInfo.email),
          name: keycloakUserInfo.name,
          keycloakId: keycloakUserInfo.sub,
          roles: [Role.user()], // Default role
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        await this.userRepository.save(user)
      } else {
        // Update existing user with latest Keycloak data
        user.synchronizeFromKeycloak({
          name: keycloakUserInfo.name,
          email: Email.create(keycloakUserInfo.email),
          roles: user.roles, // Keep existing roles
        })
        await this.userRepository.save(user)
      }

      // Step 4: Check if user is active
      if (!user.isActive) {
        throw new UserDeactivatedException('User account is deactivated. Please contact support.')
      }

      // Step 5: Generate application tokens
      const tokenPair = await this.tokenService.generateTokenPair(user.id, user.roles)

      // Step 6: Persist refresh token
      const { RefreshToken } = await import('../../../domain/entities/refresh-token.entity')
      const refreshToken = RefreshToken.create({
        id: UserId.generate().value,
        userId: user.id,
        tokenHash: await bcrypt.hash(tokenPair.refreshToken, 10),
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
      })
      await this.refreshTokenRepository.save(refreshToken)

      // Step 7: Create session record
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      await this.sessionManager.createSession({
        userId: user.id,
        deviceId: input.deviceId,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt,
      })

      // Step 8: Return authentication result
      return new AuthenticateUserOutput(
        UserDto.fromDomain(user),
        tokenPair.accessToken,
        tokenPair.refreshToken,
        tokenPair.expiresIn,
      )
    } catch (error) {
      // Handle Keycloak and other errors
      if (
        error instanceof UserDeactivatedException ||
        error instanceof AuthenticationFailedException
      ) {
        throw error
      }

      throw new AuthenticationFailedException(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
