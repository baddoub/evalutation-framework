/**
 * Port interface for Keycloak integration
 *
 * This interface defines the contract for interacting with Keycloak OAuth 2.0 server.
 * It follows the Dependency Inversion Principle - the application layer defines
 * the interface, and the infrastructure layer provides the implementation.
 */

export interface KeycloakTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface KeycloakUserInfo {
  sub: string // Keycloak user ID
  email: string
  name: string
  emailVerified?: boolean
  preferredUsername?: string
}

export interface IKeycloakAdapter {
  /**
   * Exchange authorization code for Keycloak tokens
   *
   * @param code - Authorization code from Keycloak redirect
   * @param codeVerifier - PKCE code verifier
   * @returns Keycloak tokens (access token, refresh token, expires in)
   * @throws KeycloakIntegrationException if exchange fails
   */
  exchangeCodeForTokens(code: string, codeVerifier: string): Promise<KeycloakTokens>

  /**
   * Validate Keycloak access token and extract user info
   *
   * @param token - Keycloak access token to validate
   * @returns User information from token claims
   * @throws KeycloakIntegrationException if token is invalid
   */
  validateToken(token: string): Promise<KeycloakUserInfo>

  /**
   * Refresh Keycloak tokens using refresh token
   *
   * @param refreshToken - Current Keycloak refresh token
   * @returns New token pair
   * @throws KeycloakIntegrationException if refresh fails
   */
  refreshTokens(refreshToken: string): Promise<KeycloakTokens>

  /**
   * Revoke token at Keycloak (logout)
   *
   * @param token - Token to revoke (access or refresh)
   * @throws KeycloakIntegrationException if revocation fails
   */
  revokeToken(token: string): Promise<void>

  /**
   * Get user information from Keycloak access token
   *
   * @param accessToken - Valid Keycloak access token
   * @returns User information from Keycloak
   * @throws KeycloakIntegrationException if retrieval fails
   */
  getUserInfo(accessToken: string): Promise<KeycloakUserInfo>
}
