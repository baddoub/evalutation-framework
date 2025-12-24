import { ApiProperty } from '@nestjs/swagger'
import { ScoresResponseDto } from './self-review-response.dto'

export class CalibrationAdjustmentResponseDto {
  @ApiProperty({ example: 'adjustment-uuid' })
  id!: string

  @ApiProperty({ example: 'eval-uuid' })
  evaluationId!: string

  @ApiProperty({ type: ScoresResponseDto })
  originalScores!: ScoresResponseDto

  @ApiProperty({ type: ScoresResponseDto })
  adjustedScores!: ScoresResponseDto

  @ApiProperty({ example: 3.3 })
  oldWeightedScore!: number

  @ApiProperty({ example: 3.1 })
  newWeightedScore!: number

  @ApiProperty({ example: 'MEETS' })
  oldBonusTier!: string

  @ApiProperty({ example: 'MEETS' })
  newBonusTier!: string

  @ApiProperty({ example: '2025-03-25T15:30:00Z' })
  adjustedAt!: string
}
