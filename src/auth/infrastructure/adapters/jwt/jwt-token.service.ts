import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  ITokenService,
  TokenPair,
  TokenPayload,
} from '../../../application/ports/token-service.interface'
import { UserId } from '../../../domain/value-objects/user-id.vo'
import { Role } from '../../../domain/value-objects/role.vo'
import { InvalidTokenException } from '../../exceptions/invalid-token.exception'
import { randomUUID } from 'crypto'

/**
 * JwtTokenService
 *
 * Implementation of ITokenService using NestJS JWT module
 * Generates and validates application-level JWT tokens
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string

  // In-memory revoked token store (replace with Redis in production)
  private readonly revokedTokens = new Set<string>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET')
    this.refreshTokenSecret = this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET')
    this.accessTokenExpiry = this.configService.get<string>('ACCESS_TOKEN_EXPIRY', '15m')
    this.refreshTokenExpiry = this.configService.get<string>('REFRESH_TOKEN_EXPIRY', '7d')
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(userId: UserId, roles: Role[]): Promise<TokenPair> {
    const payload = {
      sub: userId.value,
      roles: roles.map((role) => role.value),
      jti: randomUUID(),
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiry as any,
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiry as any,
    })

    // Calculate expires in seconds
    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry)

    return {
      accessToken,
      refreshToken,
      expiresIn,
    }
  }

  /**
   * Validate access token and extract payload
   */
  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.accessTokenSecret,
      })

      // Check if token is revoked
      if (this.revokedTokens.has(payload.jti)) {
        throw new InvalidTokenException('Token has been revoked')
      }

      return payload
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error
      }
      throw new InvalidTokenException('Invalid access token', error as Error)
    }
  }

  /**
   * Validate refresh token and extract payload
   */
  async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.refreshTokenSecret,
      })

      // Check if token is revoked
      if (this.revokedTokens.has(payload.jti)) {
        throw new InvalidTokenException('Token has been revoked')
      }

      return payload
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error
      }
      throw new InvalidTokenException('Invalid refresh token', error as Error)
    }
  }

  /**
   * Decode token without validation
   */
  decodeToken(token: string): TokenPayload {
    const decoded = this.jwtService.decode(token) as TokenPayload
    if (!decoded) {
      throw new InvalidTokenException('Failed to decode token')
    }
    return decoded
  }

  /**
   * Revoke token by JWT ID
   */
  async revokeToken(tokenId: string): Promise<void> {
    this.revokedTokens.add(tokenId)
  }

  /**
   * Parse expiry string to seconds
   * Supports formats like: 15m, 7d, 1h, 30s
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    }

    return value * multipliers[unit]
  }
}
