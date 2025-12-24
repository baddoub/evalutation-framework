import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator'

export class UpdateSelfReviewRequestDto {
  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact?: number

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  direction?: number

  @ApiPropertyOptional({ example: 4, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  engineeringExcellence?: number

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  operationalOwnership?: number

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact?: number

  @ApiPropertyOptional({
    example: 'This year I led the migration to microservices architecture...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  narrative?: string
}

export class SelfReviewResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  cycleId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  userId!: string

  @ApiProperty({ example: 3 })
  projectImpact!: number

  @ApiProperty({ example: 2 })
  direction!: number

  @ApiProperty({ example: 4 })
  engineeringExcellence!: number

  @ApiProperty({ example: 3 })
  operationalOwnership!: number

  @ApiProperty({ example: 2 })
  peopleImpact!: number

  @ApiProperty({ example: 'This year I led the migration...' })
  narrative!: string

  @ApiProperty({ example: 'DRAFT' })
  status!: string

  @ApiProperty({ example: '2024-01-15T10:30:00Z', nullable: true })
  submittedAt!: string | null

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2024-01-10T00:00:00Z' })
  updatedAt!: string
}
