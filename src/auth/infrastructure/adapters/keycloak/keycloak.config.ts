import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * KeycloakConfig
 *
 * Configuration service for Keycloak integration
 * Loads and validates Keycloak environment variables
 */
@Injectable()
export class KeycloakConfig {
  constructor(private readonly configService: ConfigService) {}

  get url(): string {
    return this.configService.getOrThrow<string>('KEYCLOAK_URL')
  }

  get realm(): string {
    return this.configService.getOrThrow<string>('KEYCLOAK_REALM')
  }

  get clientId(): string {
    return this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_ID')
  }

  get clientSecret(): string {
    return this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET')
  }

  get redirectUri(): string {
    return this.configService.getOrThrow<string>('KEYCLOAK_REDIRECT_URI')
  }

  /**
   * Get full token endpoint URL
   */
  get tokenEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/token`
  }

  /**
   * Get full userinfo endpoint URL
   */
  get userInfoEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/userinfo`
  }

  /**
   * Get full token introspection endpoint URL
   */
  get introspectionEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/token/introspect`
  }

  /**
   * Get full logout endpoint URL
   */
  get logoutEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/logout`
  }

  /**
   * Get JWKS (JSON Web Key Set) endpoint URL
   */
  get jwksEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/certs`
  }

  /**
   * Get authorization endpoint URL
   */
  get authorizationEndpoint(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/auth`
  }
}
