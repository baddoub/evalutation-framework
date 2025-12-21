import { Test, TestingModule } from '@nestjs/testing'
import { AuthenticateUserUseCase } from './authenticate-user.use-case'
import { IKeycloakAdapter } from '../../ports/keycloak-adapter.interface'
import { ITokenService } from '../../ports/token-service.interface'
import { ISessionManager } from '../../ports/session-manager.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { AuthenticateUserInput } from './authenticate-user.input'
import { User } from '../../../domain/entities/user.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Email } from '../../../domain/value-objects/email.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { Session } from '../../../domain/entities/session.entity'
import { AuthenticationFailedException } from '../../exceptions/authentication-failed.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase
  let keycloakAdapter: jest.Mocked<IKeycloakAdapter>
  let tokenService: jest.Mocked<ITokenService>
  let sessionManager: jest.Mocked<ISessionManager>
  let userRepository: jest.Mocked<IUserRepository>
  let refreshTokenRepository: jest.Mocked<any>

  const mockKeycloakTokens = {
    accessToken: 'keycloak_access_token',
    refreshToken: 'keycloak_refresh_token',
    expiresIn: 3600,
    tokenType: 'Bearer',
  }

  const mockKeycloakUserInfo = {
    sub: 'keycloak-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
  }

  const mockTokenPair = {
    accessToken: 'app_access_token',
    refreshToken: 'app_refresh_token',
    expiresIn: 900,
  }

  const mockUser = User.create({
    id: UserId.generate(),
    email: Email.create('test@example.com'),
    name: 'Test User',
    keycloakId: 'keycloak-user-id-123',
    roles: [Role.user()],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const mockSession = Session.create({
    id: 'session-123',
    userId: mockUser.id,
    deviceId: 'device-123',
    userAgent: 'Mozilla/5.0',
    ipAddress: '192.168.1.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastUsed: new Date(),
  })

  beforeEach(async () => {
    // Create mocks
    const mockKeycloakAdapter: jest.Mocked<IKeycloakAdapter> = {
      exchangeCodeForTokens: jest.fn(),
      validateToken: jest.fn(),
      refreshTokens: jest.fn(),
      revokeToken: jest.fn(),
      getUserInfo: jest.fn(),
    }

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
      findByManagerId: jest.fn(),    }

    const mockRefreshTokenRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByTokenHash: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      markAsUsed: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
        { provide: 'IKeycloakAdapter', useValue: mockKeycloakAdapter },
        { provide: 'ITokenService', useValue: mockTokenService },
        { provide: 'ISessionManager', useValue: mockSessionManager },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'IRefreshTokenRepository', useValue: mockRefreshTokenRepository },
      ],
    }).compile()

    useCase = module.get<AuthenticateUserUseCase>(AuthenticateUserUseCase)
    keycloakAdapter = module.get('IKeycloakAdapter')
    tokenService = module.get('ITokenService')
    sessionManager = module.get('ISessionManager')
    userRepository = module.get('IUserRepository')
    refreshTokenRepository = module.get('IRefreshTokenRepository')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const input: AuthenticateUserInput = {
      authorizationCode: 'auth_code_123',
      codeVerifier: 'code_verifier_xyz',
      deviceId: 'device-123',
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1',
    }

    it('should exchange authorization code for Keycloak tokens', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(keycloakAdapter.exchangeCodeForTokens).toHaveBeenCalledWith(
        input.authorizationCode,
        input.codeVerifier,
      )
    })

    it('should validate Keycloak token and extract user info', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(keycloakAdapter.validateToken).toHaveBeenCalledWith(mockKeycloakTokens.accessToken)
    })

    it('should create new user if not found in database', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(null)
      userRepository.save.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(userRepository.save).toHaveBeenCalled()
      expect(result.user.email).toBe(mockKeycloakUserInfo.email)
      expect(result.user.name).toBe(mockKeycloakUserInfo.name)
    })

    it('should update existing user with Keycloak data', async () => {
      // Arrange
      const existingUser = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Old Name',
        keycloakId: 'keycloak-user-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(existingUser)
      userRepository.save.mockResolvedValue(existingUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(userRepository.save).toHaveBeenCalled()
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

      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(deactivatedUser)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(UserDeactivatedException)
    })

    it('should generate application tokens', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(mockUser.id, mockUser.roles)
    })

    it('should create session record', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(sessionManager.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          deviceId: input.deviceId,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        }),
      )
    })

    it('should return authentication result with tokens and user', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens)
      keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo)
      userRepository.findByKeycloakId.mockResolvedValue(mockUser)
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair)
      refreshTokenRepository.save.mockResolvedValue(undefined)
      sessionManager.createSession.mockResolvedValue(mockSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual({
        user: expect.objectContaining({
          email: mockUser.email.value,
          name: mockUser.name,
        }),
        accessToken: mockTokenPair.accessToken,
        refreshToken: mockTokenPair.refreshToken,
        expiresIn: mockTokenPair.expiresIn,
      })
    })

    it('should handle Keycloak errors gracefully', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockRejectedValue(
        new Error('Keycloak connection failed'),
      )

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(AuthenticationFailedException)
    })

    it('should throw AuthenticationFailedException for invalid authorization code', async () => {
      // Arrange
      keycloakAdapter.exchangeCodeForTokens.mockRejectedValue(
        new Error('Invalid authorization code'),
      )

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(AuthenticationFailedException)
    })
  })
})
