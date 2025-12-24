import { ApiProperty } from '@nestjs/swagger'

class ScoresResponseDto {
  @ApiProperty({ example: 3 })
  projectImpact!: number

  @ApiProperty({ example: 2 })
  direction!: number

  @ApiProperty({ example: 4 })
  engineeringExcellence!: number

  @ApiProperty({ example: 3 })
  operationalOwnership!: number

  @ApiProperty({ example: 3 })
  peopleImpact!: number
}

export class SelfReviewResponseDto {
  @ApiProperty({ example: 'review-uuid' })
  id!: string

  @ApiProperty({ example: 'cycle-uuid' })
  cycleId!: string

  @ApiProperty({ example: 'DRAFT', enum: ['DRAFT', 'SUBMITTED'] })
  status!: string

  @ApiProperty({ type: ScoresResponseDto })
  scores!: ScoresResponseDto

  @ApiProperty({ example: 'This year, I focused on...' })
  narrative!: string

  @ApiProperty({ example: 456 })
  wordCount!: number

  @ApiProperty({ example: '2025-02-14T18:00:00Z', required: false })
  submittedAt?: string

  @ApiProperty({ example: '2025-02-01T10:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2025-02-10T15:30:00Z' })
  updatedAt!: string
}

export { ScoresResponseDto }
