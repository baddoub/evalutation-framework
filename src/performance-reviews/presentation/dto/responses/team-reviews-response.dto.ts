import { ApiProperty } from '@nestjs/swagger'

class TeamReviewDto {
  @ApiProperty({ example: 'user-uuid' })
  employeeId!: string

  @ApiProperty({ example: 'Alice Johnson' })
  employeeName!: string

  @ApiProperty({ example: 'SENIOR' })
  employeeLevel!: string

  @ApiProperty({ example: 'SUBMITTED', enum: ['DRAFT', 'SUBMITTED'] })
  selfReviewStatus!: string

  @ApiProperty({ example: 5 })
  peerFeedbackCount!: number

  @ApiProperty({ example: 'COMPLETE', enum: ['PENDING', 'COMPLETE'] })
  peerFeedbackStatus!: string

  @ApiProperty({ example: 'DRAFT', enum: ['DRAFT', 'SUBMITTED', 'CALIBRATED'] })
  managerEvalStatus!: string

  @ApiProperty({ example: false })
  hasSubmittedEvaluation!: boolean
}

export class TeamReviewsResponseDto {
  @ApiProperty({ type: [TeamReviewDto] })
  reviews!: TeamReviewDto[]

  @ApiProperty({ example: 2 })
  total!: number
}
