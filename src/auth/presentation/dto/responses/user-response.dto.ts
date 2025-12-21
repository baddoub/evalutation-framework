import { ApiProperty } from '@nestjs/swagger'

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string

  @ApiProperty({ example: 'user@example.com' })
  email!: string

  @ApiProperty({ example: 'John Doe' })
  name!: string

  @ApiProperty({ example: ['user'], enum: ['admin', 'manager', 'user'], isArray: true })
  roles!: string[]

  @ApiProperty({ example: true })
  isActive!: boolean

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: string

  @ApiProperty({ example: '2025-12-09T10:00:00.000Z' })
  updatedAt!: string
}
