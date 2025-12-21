import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from './jwt-auth.guard'
import { ITokenService } from '../../application/ports/token-service.interface'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { User } from '../../domain/entities/user.entity'
import { UserId } from '../../domain/value-objects/user-id.vo'
import { Email } from '../../domain/value-objects/email.vo'
import { Role } from '../../domain/value-objects/role.vo'

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let tokenService: jest.Mocked<ITokenService>
  let userRepository: jest.Mocked<IUserRepository>
  let reflector: Reflector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: 'ITokenService',
          useValue: {
            validateAccessToken: jest.fn(),
          },
        },
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile()

    guard = module.get<JwtAuthGuard>(JwtAuthGuard)
    tokenService = module.get('ITokenService')
    userRepository = module.get('IUserRepository')
    reflector = module.get<Reflector>(Reflector)
  })

  const createMockExecutionContext = (headers: any = {}, isPublic = false): ExecutionContext => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic)

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          user: undefined,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  it('should allow access with valid token', async () => {
    const userId = UserId.generate()
    const user = User.create({
      id: userId,
      email: Email.create('test@example.com'),
      name: 'Test User',
      keycloakId: 'keycloak-123',
      roles: [Role.user()],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const context = createMockExecutionContext({
      authorization: 'Bearer valid-token',
    })

    tokenService.validateAccessToken.mockResolvedValue({
      sub: userId.value,
      email: 'test@example.com',
      roles: ['user'],
    } as any)

    userRepository.findById.mockResolvedValue(user)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(tokenService.validateAccessToken).toHaveBeenCalledWith('valid-token')
    expect(userRepository.findById).toHaveBeenCalled()
  })

  it('should deny access without token', async () => {
    const context = createMockExecutionContext({})

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should deny access with invalid token', async () => {
    const context = createMockExecutionContext({
      authorization: 'Bearer invalid-token',
    })

    tokenService.validateAccessToken.mockRejectedValue(new Error('Invalid token'))

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should deny access for deactivated user', async () => {
    const userId = UserId.generate()
    const user = User.create({
      id: userId,
      email: Email.create('test@example.com'),
      name: 'Test User',
      keycloakId: 'keycloak-123',
      roles: [Role.user()],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    user.deactivate()

    const context = createMockExecutionContext({
      authorization: 'Bearer valid-token',
    })

    tokenService.validateAccessToken.mockResolvedValue({
      sub: userId.value,
      email: 'test@example.com',
      roles: ['user'],
    } as any)

    userRepository.findById.mockResolvedValue(user)

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should allow public endpoints without token', async () => {
    const context = createMockExecutionContext({}, true)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(tokenService.validateAccessToken).not.toHaveBeenCalled()
  })
})
