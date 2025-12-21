import { Injectable } from '@nestjs/common'
import {
  IKeycloakAdapter,
  KeycloakTokens,
  KeycloakUserInfo,
} from '../../../application/ports/keycloak-adapter.interface'
import { KeycloakConfig } from './keycloak.config'
import { KeycloakIntegrationException } from '../../exceptions/keycloak-integration.exception'
import * as jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

/**
 * KeycloakAdapter
 *
 * Implementation of IKeycloakAdapter using Keycloak REST API
 * Handles OAuth2 token exchange, validation, and user info retrieval
 */
@Injectable()
export class KeycloakAdapter implements IKeycloakAdapter {
  private readonly jwksClient: jwksClient.JwksClient

  constructor(private readonly config: KeycloakConfig) {
    // Initialize JWKS client for token signature verification
    this.jwksClient = jwksClient({
      jwksUri: this.config.jwksEndpoint,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
    })
  }

  /**
   * Exchange authorization code for Keycloak tokens
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<KeycloakTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        code_verifier: codeVerifier,
        redirect_uri: this.config.redirectUri,
      })

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new KeycloakIntegrationException(`Failed to exchange code for tokens: ${error}`)
      }

      const data = await response.json()

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      }
    } catch (error) {
      if (error instanceof KeycloakIntegrationException) {
        throw error
      }
      throw new KeycloakIntegrationException(
        'Failed to exchange authorization code',
        error as Error,
      )
    }
  }

  /**
   * Validate Keycloak access token and extract user info
   */
  async validateToken(token: string): Promise<KeycloakUserInfo> {
    try {
      // Decode token header to get key ID (kid)
      const decoded = jwt.decode(token, { complete: true })
      if (!decoded || !decoded.header.kid) {
        throw new KeycloakIntegrationException('Invalid token format')
      }

      // Get signing key from JWKS
      const key = await this.getSigningKey(decoded.header.kid)

      // Verify token signature and get payload
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: `${this.config.url}/realms/${this.config.realm}`,
      }) as any

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.preferred_username,
        emailVerified: payload.email_verified,
        preferredUsername: payload.preferred_username,
      }
    } catch (error) {
      if (error instanceof KeycloakIntegrationException) {
        throw error
      }
      throw new KeycloakIntegrationException('Failed to validate token', error as Error)
    }
  }

  /**
   * Refresh Keycloak tokens using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<KeycloakTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      })

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new KeycloakIntegrationException(`Failed to refresh tokens: ${error}`)
      }

      const data = await response.json()

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      }
    } catch (error) {
      if (error instanceof KeycloakIntegrationException) {
        throw error
      }
      throw new KeycloakIntegrationException('Failed to refresh tokens', error as Error)
    }
  }

  /**
   * Revoke token at Keycloak (logout)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        token,
      })

      const response = await fetch(this.config.logoutEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new KeycloakIntegrationException(`Failed to revoke token: ${error}`)
      }
    } catch (error) {
      if (error instanceof KeycloakIntegrationException) {
        throw error
      }
      throw new KeycloakIntegrationException('Failed to revoke token', error as Error)
    }
  }

  /**
   * Get user information from Keycloak access token
   */
  async getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
    try {
      const response = await fetch(this.config.userInfoEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new KeycloakIntegrationException(`Failed to get user info: ${error}`)
      }

      const data = await response.json()

      return {
        sub: data.sub,
        email: data.email,
        name: data.name || data.preferred_username,
        emailVerified: data.email_verified,
        preferredUsername: data.preferred_username,
      }
    } catch (error) {
      if (error instanceof KeycloakIntegrationException) {
        throw error
      }
      throw new KeycloakIntegrationException('Failed to get user info', error as Error)
    }
  }

  /**
   * Get signing key from JWKS
   */
  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(new KeycloakIntegrationException('Failed to get signing key', err))
        } else {
          const signingKey = key?.getPublicKey()
          if (!signingKey) {
            reject(new KeycloakIntegrationException('Signing key not found'))
          } else {
            resolve(signingKey)
          }
        }
      })
    })
  }
}
