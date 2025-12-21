import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

export class DeliverFeedbackRequestDto {
  @ApiProperty({
    example: 'Great work this year! Focus areas for next year include...',
    maxLength: 5000
  })
  @IsString()
  @MaxLength(5000)
  feedbackNotes!: string
}

export class FinalScoreResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  cycleId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  employeeId!: string

  @ApiProperty({ example: 3.2 })
  weightedScore!: number

  @ApiProperty({ example: 80.0 })
  percentageScore!: number

  @ApiProperty({ example: 'MEETS_EXPECTATIONS' })
  bonusTier!: string

  @ApiPropertyOptional({ example: 'Great work this year!...', nullable: true })
  feedbackNotes?: string

  @ApiProperty({ example: '2024-03-15T10:00:00Z', nullable: true })
  deliveredAt!: string | null

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true })
  deliveredBy!: string | null

  @ApiProperty({ example: '2024-03-10T00:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2024-03-15T10:00:00Z' })
  updatedAt!: string
}

export class ScoreAdjustmentRequestDto {
  @ApiProperty({ example: 3.5 })
  newWeightedScore!: number

  @ApiProperty({
    example: 'Score adjustment requested due to additional project completion',
    maxLength: 1000
  })
  @IsString()
  @MaxLength(1000)
  reason!: string

  @ApiProperty({
    example: {
      projectImpact: 3,
      direction: 3,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 3
    }
  })
  proposedScores!: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
}

export class ScoreAdjustmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  finalScoreId!: string

  @ApiProperty({ example: 3.2 })
  previousScore!: number

  @ApiProperty({ example: 3.5 })
  requestedScore!: number

  @ApiProperty({ example: 'Score adjustment requested due to...' })
  reason!: string

  @ApiProperty({ example: 'PENDING' })
  status!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  requestedBy!: string

  @ApiProperty({ example: '2024-03-21T14:00:00Z', nullable: true })
  reviewedAt!: string | null

  @ApiProperty({ example: 'Approved after review', nullable: true })
  reviewNotes!: string | null

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  requestedAt!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true })
  reviewedBy!: string | null
}
