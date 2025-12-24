import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { LoginUserInput } from './login-user.input'
import { LoginUserOutput } from './login-user.output'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { ITokenService } from '../../ports/token-service.interface'
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface'
import { Email } from '../../../domain/value-objects/email.vo'
import { RefreshToken } from '../../../domain/entities/refresh-token.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // Find user by email
    const email = Email.create(input.email)
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated')
    }

    // For now, we'll accept any password since we're using OAuth
    // In a real implementation, you would verify the password hash
    // For demo purposes, let's skip password validation

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
        roles: user.roles.map((r) => r.value),
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
