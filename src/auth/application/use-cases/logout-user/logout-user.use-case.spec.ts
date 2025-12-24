import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { LogoutUserUseCase } from './logout-user.use-case'
import type { ISessionManager } from '../../ports/session-manager.interface'
import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import type { LogoutUserInput } from './logout-user.input'
import { UserId } from '../../../domain/value-objects/user-id.vo'

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase
  let sessionManager: jest.Mocked<ISessionManager>
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>

  const mockUserId = UserId.generate()

  beforeEach(async () => {
    const mockSessionManager: jest.Mocked<ISessionManager> = {
      createSession: jest.fn(),
      findByRefreshToken: jest.fn(),
      markTokenAsUsed: jest.fn(),
      updateSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      findActiveSessions: jest.fn(),
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
        LogoutUserUseCase,
        { provide: 'ISessionManager', useValue: mockSessionManager },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile()

    useCase = module.get<LogoutUserUseCase>(LogoutUserUseCase)
    sessionManager = module.get('ISessionManager')
    refreshTokenRepository = module.get('IRefreshTokenRepository')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const input: LogoutUserInput = {
      userId: mockUserId,
    }

    it('should revoke all user sessions', async () => {
      // Arrange
      sessionManager.revokeAllUserSessions.mockResolvedValue(undefined)
      refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined)

      // Act
      await useCase.execute(input)

      // Assert
      expect(sessionManager.revokeAllUserSessions).toHaveBeenCalledWith(mockUserId)
    })

    it('should delete all user refresh tokens', async () => {
      // Arrange
      sessionManager.revokeAllUserSessions.mockResolvedValue(undefined)
      refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined)

      // Act
      await useCase.execute(input)

      // Assert
      expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle already logged out user gracefully', async () => {
      // Arrange
      sessionManager.revokeAllUserSessions.mockResolvedValue(undefined)
      refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined)

      // Act & Assert - should not throw
      await expect(useCase.execute(input)).resolves.not.toThrow()
    })

    it('should complete successfully', async () => {
      // Arrange
      sessionManager.revokeAllUserSessions.mockResolvedValue(undefined)
      refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined)

      // Act
      await useCase.execute(input)

      // Assert - both operations should be called
      expect(sessionManager.revokeAllUserSessions).toHaveBeenCalled()
      expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalled()
    })
  })
})
