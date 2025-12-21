/**
 * Mock Keycloak responses for testing
 */
export class KeycloakMock {
  static mockTokenResponse(overrides?: Partial<TokenResponse>): TokenResponse {
    return {
      access_token: overrides?.access_token ?? 'mock-access-token',
      refresh_token: overrides?.refresh_token ?? 'mock-refresh-token',
      expires_in: overrides?.expires_in ?? 300,
      refresh_expires_in: overrides?.refresh_expires_in ?? 1800,
      token_type: overrides?.token_type ?? 'Bearer',
      'not-before-policy': overrides?.['not-before-policy'] ?? 0,
      session_state: overrides?.session_state ?? 'mock-session-state',
      scope: overrides?.scope ?? 'openid email profile',
    }
  }

  static mockUserInfo(overrides?: Partial<UserInfo>): UserInfo {
    return {
      sub: overrides?.sub ?? 'keycloak-user-id',
      email: overrides?.email ?? 'test@example.com',
      email_verified: overrides?.email_verified ?? true,
      name: overrides?.name ?? 'Test User',
      preferred_username: overrides?.preferred_username ?? 'testuser',
      given_name: overrides?.given_name ?? 'Test',
      family_name: overrides?.family_name ?? 'User',
    }
  }

  static mockDecodedToken(overrides?: Partial<DecodedToken>): DecodedToken {
    return {
      sub: overrides?.sub ?? 'keycloak-user-id',
      email: overrides?.email ?? 'test@example.com',
      email_verified: overrides?.email_verified ?? true,
      name: overrides?.name ?? 'Test User',
      preferred_username: overrides?.preferred_username ?? 'testuser',
      realm_access: overrides?.realm_access ?? { roles: ['user'] },
      resource_access: overrides?.resource_access ?? {},
      iat: overrides?.iat ?? Math.floor(Date.now() / 1000),
      exp: overrides?.exp ?? Math.floor(Date.now() / 1000) + 300,
      iss: overrides?.iss ?? 'http://localhost:8080/realms/evaluation-framework',
      aud: overrides?.aud ?? 'nest-api',
    }
  }
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  'not-before-policy': number
  session_state: string
  scope: string
}

interface UserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  preferred_username: string
  given_name?: string
  family_name?: string
}

interface DecodedToken {
  sub: string
  email: string
  email_verified: boolean
  name: string
  preferred_username: string
  realm_access: { roles: string[] }
  resource_access: Record<string, unknown>
  iat: number
  exp: number
  iss: string
  aud: string
}
