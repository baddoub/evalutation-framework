import { ApiProperty } from '@nestjs/swagger'
import { ScoresResponseDto } from './self-review-response.dto'

export class ManagerEvaluationResponseDto {
  @ApiProperty({ example: 'eval-uuid' })
  id!: string

  @ApiProperty({ example: 'user-uuid' })
  employeeId!: string

  @ApiProperty({ example: 'DRAFT', enum: ['DRAFT', 'SUBMITTED', 'CALIBRATED'] })
  status!: string

  @ApiProperty({ type: ScoresResponseDto, required: false })
  scores?: ScoresResponseDto

  @ApiProperty({ example: 'Alice had a strong year...', required: false })
  narrative?: string

  @ApiProperty({ example: 'Technical excellence, mentorship', required: false })
  strengths?: string

  @ApiProperty({ example: 'Strategic thinking, cross-team communication', required: false })
  growthAreas?: string

  @ApiProperty({
    example: 'Focus on architecture design, lead cross-org initiative',
    required: false,
  })
  developmentPlan?: string

  @ApiProperty({ example: '2025-03-14T16:00:00Z', required: false })
  submittedAt?: string

  @ApiProperty({ example: '2025-03-25T15:30:00Z', required: false })
  calibratedAt?: string

  @ApiProperty({ example: '2025-03-10T10:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2025-03-14T16:00:00Z' })
  updatedAt!: string
}
