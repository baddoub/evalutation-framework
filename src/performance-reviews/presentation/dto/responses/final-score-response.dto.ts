import { ApiProperty } from '@nestjs/swagger'
import { ScoresResponseDto } from './self-review-response.dto'

class EmployeeInfoDto {
  @ApiProperty({ example: 'user-uuid' })
  id!: string

  @ApiProperty({ example: 'Alice Johnson' })
  name!: string

  @ApiProperty({ example: 'SENIOR' })
  level!: string
}

class CycleInfoDto {
  @ApiProperty({ example: 'cycle-uuid' })
  id!: string

  @ApiProperty({ example: '2025 Annual Review' })
  name!: string

  @ApiProperty({ example: 2025 })
  year!: number
}

class PeerFeedbackSummaryDto {
  @ApiProperty({ type: ScoresResponseDto })
  averageScores!: ScoresResponseDto

  @ApiProperty({ example: 5 })
  count!: number
}

export class FinalScoreResponseDto {
  @ApiProperty({ type: EmployeeInfoDto })
  employee!: EmployeeInfoDto

  @ApiProperty({ type: CycleInfoDto })
  cycle!: CycleInfoDto

  @ApiProperty({ type: ScoresResponseDto })
  scores!: ScoresResponseDto

  @ApiProperty({ type: PeerFeedbackSummaryDto })
  peerFeedbackSummary!: PeerFeedbackSummaryDto

  @ApiProperty({ example: 3.3 })
  weightedScore!: number

  @ApiProperty({ example: 82.5 })
  percentageScore!: number

  @ApiProperty({ example: 'MEETS', enum: ['EXCEEDS', 'MEETS', 'BELOW'] })
  bonusTier!: string

  @ApiProperty({ example: true })
  isLocked!: boolean

  @ApiProperty({ example: true })
  feedbackDelivered!: boolean

  @ApiProperty({ example: '2025-04-10T15:00:00Z', required: false })
  feedbackDeliveredAt?: string
}
