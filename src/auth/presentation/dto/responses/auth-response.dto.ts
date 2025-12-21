import { ApiProperty } from '@nestjs/swagger'
import { UserResponseDto } from './user-response.dto'

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string

  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string

  @ApiProperty({ example: 900, description: 'Token expiration in seconds' })
  expiresIn!: number

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto
}
