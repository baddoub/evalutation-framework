import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator'

export class UpdateManagerEvaluationRequestDto {
  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact?: number

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 4 })
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

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact?: number

  @ApiPropertyOptional({
    example: 'John has shown exceptional growth this year...',
    maxLength: 3000
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  managerComments?: string
}

export class SubmitManagerEvaluationRequestDto {
  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact!: number

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  direction!: number

  @ApiProperty({ example: 4, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  engineeringExcellence!: number

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  operationalOwnership!: number

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact!: number

  @ApiProperty({
    example: 'John has consistently delivered high-impact projects...',
    maxLength: 3000
  })
  @IsString()
  @MaxLength(3000)
  narrative!: string

  @ApiProperty({
    example: 'Strong technical leadership and mentoring skills...',
    maxLength: 2000
  })
  @IsString()
  @MaxLength(2000)
  strengths!: string

  @ApiProperty({
    example: 'Could improve time management and prioritization...',
    maxLength: 2000
  })
  @IsString()
  @MaxLength(2000)
  growthAreas!: string

  @ApiProperty({
    example: 'Focus on delegation and team empowerment in Q2...',
    maxLength: 2000
  })
  @IsString()
  @MaxLength(2000)
  developmentPlan!: string
}

export class ManagerEvaluationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  cycleId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  employeeId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  managerId!: string

  @ApiProperty({ example: 3 })
  projectImpact!: number

  @ApiProperty({ example: 3 })
  direction!: number

  @ApiProperty({ example: 4 })
  engineeringExcellence!: number

  @ApiProperty({ example: 3 })
  operationalOwnership!: number

  @ApiProperty({ example: 3 })
  peopleImpact!: number

  @ApiPropertyOptional({ example: 'John has shown exceptional growth...' })
  managerComments?: string

  @ApiProperty({ example: 'DRAFT' })
  status!: string

  @ApiProperty({ example: '2024-02-15T10:30:00Z', nullable: true })
  submittedAt!: string | null

  @ApiProperty({ example: '2024-02-01T00:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2024-02-10T00:00:00Z' })
  updatedAt!: string
}
