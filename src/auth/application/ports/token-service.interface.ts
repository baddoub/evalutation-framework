/**
 * Port interface for JWT token operations
 *
 * This interface defines the contract for generating and validating
 * application-level JWT tokens (not Keycloak tokens).
 */

import { UserId } from '../../domain/value-objects/user-id.vo'
import { Role } from '../../domain/value-objects/role.vo'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface TokenPayload {
  sub: string // User ID
  email: string
  roles: string[]
  iat: number // Issued at
  exp: number // Expiration
  jti: string // JWT ID
}

export interface ITokenService {
  /**
   * Generate access and refresh token pair for authenticated user
   *
   * @param userId - User identifier
   * @param roles - User roles for authorization
   * @returns Token pair with expiration time
   */
  generateTokenPair(userId: UserId, roles: Role[]): Promise<TokenPair>

  /**
   * Validate access token and extract payload
   *
   * @param token - JWT access token
   * @returns Decoded and validated token payload
   * @throws InvalidTokenException if token is invalid or expired
   */
  validateAccessToken(token: string): Promise<TokenPayload>

  /**
   * Validate refresh token and extract payload
   *
   * @param token - JWT refresh token
   * @returns Decoded and validated token payload
   * @throws InvalidTokenException if token is invalid or expired
   */
  validateRefreshToken(token: string): Promise<TokenPayload>

  /**
   * Decode token without validation (for logging/debugging)
   *
   * @param token - JWT token
   * @returns Decoded token payload
   */
  decodeToken(token: string): TokenPayload

  /**
   * Revoke token by JWT ID
   *
   * @param tokenId - JWT ID (jti claim)
   */
  revokeToken(tokenId: string): Promise<void>
}
