import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Keycloak',
    example: 'ey1234567890abcdef',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  code!: string

  @ApiProperty({
    description: 'PKCE code verifier',
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    minLength: 43,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(43)
  @MaxLength(128)
  codeVerifier!: string

  @ApiProperty({
    description: 'CSRF state parameter',
    example: 'xyz123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  state?: string
}
