import { ApiProperty } from '@nestjs/swagger'

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string

  @ApiProperty({ example: 900 })
  expiresIn!: number
}
