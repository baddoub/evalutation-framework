import { ApiProperty } from '@nestjs/swagger'

class PeerFeedbackRequestDto {
  @ApiProperty({ example: 'nomination-uuid' })
  nominationId!: string

  @ApiProperty({ example: 'user-uuid' })
  revieweeId!: string

  @ApiProperty({ example: 'Alice Johnson' })
  revieweeName!: string

  @ApiProperty({ example: 'SENIOR' })
  revieweeLevel!: string

  @ApiProperty({ example: 'Platform Engineering' })
  revieweeDepartment!: string

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'COMPLETED'] })
  status!: string

  @ApiProperty({ example: '2025-03-01T23:59:59Z' })
  deadline!: string
}

export class PeerFeedbackRequestsResponseDto {
  @ApiProperty({ type: [PeerFeedbackRequestDto] })
  requests!: PeerFeedbackRequestDto[]

  @ApiProperty({ example: 3 })
  total!: number
}
