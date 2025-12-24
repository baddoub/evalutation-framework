import { ApiProperty } from '@nestjs/swagger'

class CycleDeadlinesResponseDto {
  @ApiProperty({ example: '2025-02-15T23:59:59Z' })
  selfReview!: string

  @ApiProperty({ example: '2025-03-01T23:59:59Z' })
  peerFeedback!: string

  @ApiProperty({ example: '2025-03-15T23:59:59Z' })
  managerEval!: string

  @ApiProperty({ example: '2025-03-30T23:59:59Z' })
  calibration!: string

  @ApiProperty({ example: '2025-04-15T23:59:59Z' })
  feedbackDelivery!: string
}

export class ReviewCycleResponseDto {
  @ApiProperty({ example: 'cycle-uuid' })
  id!: string

  @ApiProperty({ example: '2025 Annual Review' })
  name!: string

  @ApiProperty({ example: 2025 })
  year!: number

  @ApiProperty({ example: 'ACTIVE', enum: ['DRAFT', 'ACTIVE', 'CALIBRATION', 'COMPLETED'] })
  status!: string

  @ApiProperty({ type: CycleDeadlinesResponseDto })
  deadlines!: CycleDeadlinesResponseDto

  @ApiProperty({ example: '2025-02-01T00:00:00Z' })
  startDate!: string

  @ApiProperty({ example: '2025-04-15T00:00:00Z', required: false })
  endDate?: string

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  updatedAt!: string
}
