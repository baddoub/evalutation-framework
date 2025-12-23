// Mock bcrypt before importing anything else
const realBcrypt = jest.requireActual('bcrypt')

jest.mock('bcrypt', () => ({
  ...realBcrypt,
  compare: jest.fn().mockResolvedValue(true),
}))

import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { RefreshTokensUseCase } from './refresh-tokens.use-case'
import type { ITokenService } from '../../ports/token-service.interface'
import type { ISessionManager } from '../../ports/session-manager.interface'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { RefreshTokensInput } from './refresh-tokens.input'
import { User } from '../../../domain/entities/user.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Email } from '../../../domain/value-objects/email.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import { TokenExpiredException } from '../../exceptions/token-expired.exception'
import { TokenTheftDetectedException } from '../../exceptions/token-theft-detected.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'

// Pre-compute the hash for testing (this is the hash of 'mock_refresh_token')
const MOCK_REFRESH_TOKEN_HASH = realBcrypt.hashSync('mock_refresh_token', 10)

describe('RefreshTokensUseCase', () => {
  let useCase: RefreshTokensUseCase
  let tokenService: jest.Mocked<ITokenService>
  let sessionManager: jest.Mocked<ISessionManager>
  let userRepository: jest.Mocked<IUserRepository>
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>
  let mockUser: User
  let mockTokenPayload: {
    sub: string
    email: string
    roles: string[]
    iat: number
    exp: number
    jti: string
  }
  let mockNewTokenPair: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  let mockRefreshToken: RefreshToken

  beforeEach(async () => {
    // Create fresh instances for each test to avoid state pollution
    mockUser = User.create({
      id: UserId.generate(),
      email: Email.create('test@example.com'),
      name: 'Test User',
      keycloakId: 'keycloak-user-id-123',
      roles: [Role.user()],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    mockTokenPayload = {
      sub: mockUser.id.value,
      email: mockUser.email.value,
      roles: ['user'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      jti: 'token-id-123',
    }

    mockNewTokenPair = {
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      expiresIn: 900,
    }

    mockRefreshToken = RefreshToken.create({
      id: 'refresh-token-id',
      userId: mockUser.id,
      tokenHash: MOCK_REFRESH_TOKEN_HASH,
      used: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    })

    const mockTokenService: jest.Mocked<ITokenService> = {
      generateTokenPair: jest.fn(),
      validateAccessToken: jest.fn(),
      validateRefreshToken: jest.fn(),
      decodeToken: jest.fn(),
      revokeToken: jest.fn(),
    }

    const mockSessionManager: jest.Mocked<ISessionManager> = {
      createSession: jest.fn(),
      findByRefreshToken: jest.fn(),
      markTokenAsUsed: jest.fn(),
      updateSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      findActiveSessions: jest.fn(),
    }

    const mockUserRepository: jest.Mocked<IUserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      findByManagerId: jest.fn(),
    }

    const mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository> = {
      findById: jest.fn(),
      findByTokenHash: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
      deleteExpiredAndRevoked: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensUseCase,
        { provide: 'ITokenService', useValue: mockTokenService },
        { provide: 'ISessionManager', useValue: mockSessionManager },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile()

    useCase = module.get<RefreshTokensUseCase>(RefreshTokensUseCase)
    tokenService = module.get('ITokenService')
    sessionManager = module.get('ISessionManager')
    userRepository = module.get('IUserRepository')
    refreshTokenRepository = module.get('IRefreshTokenRepository')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const input: RefreshTokensInput = {
      refreshToken: 'refresh_token_value',
    }

    it('should validate refresh token', async () => {
      // Arrange
      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken])
      tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair)
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken)

      // Act
      await useCase.execute(input)

      // Assert
      expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(input.refreshToken)
    })

    it('should check if token was already used', async () => {
      // Arrange
      const usedToken = RefreshToken.create({
        id: 'used-token-id',
        userId: mockUser.id,
        tokenHash: MOCK_REFRESH_TOKEN_HASH,
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      })
      usedToken.markAsUsed()

      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([usedToken])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(TokenTheftDetectedException)
    })

    it('should mark old token as used', async () => {
      // Arrange
      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken])
      tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair)
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken)

      // Act
      await useCase.execute(input)

      // Assert
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          used: true,
        }),
      )
    })

    it('should generate new token pair', async () => {
      // Arrange
      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken])
      tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair)
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken)

      // Act
      await useCase.execute(input)

      // Assert
      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(mockUser.id, mockUser.roles)
    })

    it('should detect token theft when token is reused', async () => {
      // Arrange
      const usedToken = RefreshToken.create({
        id: 'used-token-id',
        userId: mockUser.id,
        tokenHash: MOCK_REFRESH_TOKEN_HASH,
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      })
      usedToken.markAsUsed()

      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([usedToken])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(TokenTheftDetectedException)
    })

    it('should revoke all sessions when theft is detected', async () => {
      // Arrange
      const usedToken = RefreshToken.create({
        id: 'used-token-id',
        userId: mockUser.id,
        tokenHash: MOCK_REFRESH_TOKEN_HASH,
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      })
      usedToken.markAsUsed()

      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([usedToken])

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(sessionManager.revokeAllUserSessions).toHaveBeenCalledWith(mockUser.id)
      expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalledWith(mockUser.id)
    })

    it('should throw error for expired token', async () => {
      // Arrange
      const expiredToken = RefreshToken.create({
        id: 'expired-token-id',
        userId: mockUser.id,
        tokenHash: MOCK_REFRESH_TOKEN_HASH,
        used: false,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(Date.now() - 10000),
      })

      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([expiredToken])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(TokenExpiredException)
    })

    it('should throw error if user not found', async () => {
      // Arrange
      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow()
    })

    it('should throw error if user is deactivated', async () => {
      // Arrange
      const deactivatedUser = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-user-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      deactivatedUser.deactivate()

      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(deactivatedUser)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(UserDeactivatedException)
    })

    it('should return new access token and refresh token', async () => {
      // Arrange
      tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload)
      userRepository.findById.mockResolvedValue(mockUser)
      refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken])
      tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair)
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual({
        accessToken: mockNewTokenPair.accessToken,
        refreshToken: mockNewTokenPair.refreshToken,
        expiresIn: mockNewTokenPair.expiresIn,
      })
    })
  })
})
