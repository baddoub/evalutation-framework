import { ApiProperty } from '@nestjs/swagger'
import { ScoresResponseDto } from './self-review-response.dto'

export class PeerFeedbackResponseDto {
  @ApiProperty({ example: 'feedback-uuid' })
  id!: string

  @ApiProperty({ example: 'user-uuid' })
  revieweeId!: string

  @ApiProperty({ example: '2025-02-28T14:30:00Z' })
  submittedAt!: string

  @ApiProperty({ example: true })
  isAnonymized!: boolean
}

class AnonymizedCommentDto {
  @ApiProperty({ example: 'Strong technical skills, great mentor', required: false })
  strengths?: string

  @ApiProperty({ example: 'Could improve documentation practices', required: false })
  growthAreas?: string

  @ApiProperty({ example: 'General feedback', required: false })
  generalComments?: string
}

export class AggregatedPeerFeedbackResponseDto {
  @ApiProperty({ type: ScoresResponseDto })
  aggregatedScores!: ScoresResponseDto

  @ApiProperty({ example: 5 })
  feedbackCount!: number

  @ApiProperty({ type: [AnonymizedCommentDto] })
  anonymizedComments!: AnonymizedCommentDto[]
}
