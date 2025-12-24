import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { GetCurrentUserUseCase } from './get-current-user.use-case'
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import type { GetCurrentUserInput } from './get-current-user.input'
import { User } from '../../../domain/entities/user.entity'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Email } from '../../../domain/value-objects/email.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { UserNotFoundException } from '../../exceptions/user-not-found.exception'
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception'

describe('GetCurrentUserUseCase', () => {
  let useCase: GetCurrentUserUseCase
  let userRepository: jest.Mocked<IUserRepository>

  const mockUserId = UserId.generate()
  const mockUser = User.create({
    id: mockUserId,
    email: Email.create('test@example.com'),
    name: 'Test User',
    keycloakId: 'keycloak-user-id-123',
    roles: [Role.user()],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurrentUserUseCase,
        { provide: 'IUserRepository', useValue: mockUserRepository },
      ],
    }).compile()

    useCase = module.get<GetCurrentUserUseCase>(GetCurrentUserUseCase)
    userRepository = module.get('IUserRepository')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    const input: GetCurrentUserInput = {
      userId: mockUserId,
    }

    it('should return user by ID', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserId)
      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id.value,
          email: mockUser.email.value,
          name: mockUser.name,
        }),
      )
    })

    it('should throw error if user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(UserNotFoundException)
    })

    it('should throw error if user deactivated', async () => {
      // Arrange
      const deactivatedUser = User.create({
        id: mockUserId,
        email: Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-user-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      deactivatedUser.deactivate()

      userRepository.findById.mockResolvedValue(deactivatedUser)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(UserDeactivatedException)
    })

    it('should return complete user information', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.user).toHaveProperty('id')
      expect(result.user).toHaveProperty('email')
      expect(result.user).toHaveProperty('name')
      expect(result.user).toHaveProperty('roles')
      expect(result.user).toHaveProperty('isActive')
      expect(result.user).toHaveProperty('createdAt')
      expect(result.user).toHaveProperty('updatedAt')
    })
  })
})
