import { Inject, Injectable, ConflictException } from '@nestjs/common'
import { RegisterUserInput } from './register-user.input'
import { RegisterUserOutput } from './register-user.output'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { ITokenService } from '../../ports/token-service.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { User } from '../../../domain/entities/user.entity'
import { Email } from '../../../domain/value-objects/email.vo'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Check if user already exists
    const email = Email.create(input.email)
    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    // Hash password (currently not stored - using OAuth with Keycloak)
    // TODO: Store password hash when implementing local authentication
    await bcrypt.hash(input.password, 10)

    // Create user
    const user = User.create({
      id: UserId.generate(),
      email,
      name: input.name,
      keycloakId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a local ID
      roles: [Role.user()], // Default role
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Save user
    await this.userRepository.save(user)

    // Generate tokens
    const tokenPair = await this.tokenService.generateTokenPair(user.id, user.roles)

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(tokenPair.refreshToken, 10)
    const refreshToken = RefreshToken.create({
      id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      tokenHash: refreshTokenHash,
      used: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    })

    await this.refreshTokenRepository.save(refreshToken)

    return {
      user: {
        id: user.id.value,
        email: user.email.value,
        name: user.name,
        roles: user.roles.map(r => r.value),
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
    }
  }
}
