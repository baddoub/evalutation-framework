/**
 * Application Layer Data Transfer Object for Keycloak User Data
 *
 * Represents user data received from Keycloak during authentication.
 * Used to synchronize user information from Keycloak to local database.
 */

export class KeycloakUserDataDto {
  constructor(
    public readonly keycloakId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly emailVerified?: boolean,
    public readonly preferredUsername?: string,
  ) {}

  /**
   * Create from Keycloak token claims or user info response
   */
  static fromKeycloakUserInfo(userInfo: {
    sub: string
    email: string
    name: string
    email_verified?: boolean
    preferred_username?: string
  }): KeycloakUserDataDto {
    return new KeycloakUserDataDto(
      userInfo.sub,
      userInfo.email,
      userInfo.name,
      userInfo.email_verified,
      userInfo.preferred_username,
    )
  }
}
