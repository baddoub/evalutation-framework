import { ApiProperty } from '@nestjs/swagger'

export class AuthorizationUrlResponseDto {
  @ApiProperty({
    example: 'https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth?...',
    description: 'Full Keycloak authorization URL for user redirect',
  })
  authorizationUrl!: string

  @ApiProperty({
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    description: 'PKCE code verifier to be sent in callback',
  })
  codeVerifier!: string

  @ApiProperty({
    example: 'xyz123',
    description: 'CSRF state parameter to validate callback',
  })
  state!: string
}
