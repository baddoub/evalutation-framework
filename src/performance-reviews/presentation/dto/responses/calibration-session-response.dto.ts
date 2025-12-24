import { ApiProperty } from '@nestjs/swagger'

export class CalibrationSessionResponseDto {
  @ApiProperty({ example: 'session-uuid' })
  id!: string

  @ApiProperty({ example: 'Platform Engineering Calibration' })
  name!: string

  @ApiProperty({ example: 'SCHEDULED', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] })
  status!: string

  @ApiProperty({ example: '2025-03-25T14:00:00Z' })
  scheduledAt!: string

  @ApiProperty({ example: '2025-03-25T16:00:00Z', required: false })
  completedAt?: string

  @ApiProperty({ example: 2 })
  participantCount!: number

  @ApiProperty({ example: '2025-03-20T10:00:00Z' })
  createdAt!: string
}
