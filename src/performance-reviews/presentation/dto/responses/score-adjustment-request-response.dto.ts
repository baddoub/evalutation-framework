import { ApiProperty } from '@nestjs/swagger'
import { ScoresResponseDto } from './self-review-response.dto'

export class ScoreAdjustmentRequestResponseDto {
  @ApiProperty({ example: 'request-uuid' })
  id!: string

  @ApiProperty({ example: 'user-uuid' })
  employeeId!: string

  @ApiProperty({ example: 'Alice Johnson', required: false })
  employeeName?: string

  @ApiProperty({ example: 'manager-uuid', required: false })
  requesterId?: string

  @ApiProperty({ example: 'Carol Manager', required: false })
  requesterName?: string

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: string

  @ApiProperty({ example: 'New project completion after calibration warrants score increase' })
  reason!: string

  @ApiProperty({ type: ScoresResponseDto, required: false })
  currentScores?: ScoresResponseDto

  @ApiProperty({ type: ScoresResponseDto })
  proposedScores!: ScoresResponseDto

  @ApiProperty({ example: '2025-04-01T10:00:00Z' })
  requestedAt!: string

  @ApiProperty({ example: '2025-04-02T14:00:00Z', required: false })
  reviewedAt?: string

  @ApiProperty({ example: 'hr-admin-uuid', required: false })
  approvedBy?: string

  @ApiProperty({ example: 'Not enough justification provided', required: false })
  rejectionReason?: string
}
