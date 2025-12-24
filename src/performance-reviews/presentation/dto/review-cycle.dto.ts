import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsInt, IsDateString, Min, Max } from 'class-validator'

export enum ReviewCycleStatusDto {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CALIBRATING = 'CALIBRATING',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export class CreateReviewCycleRequestDto {
  @ApiProperty({ example: '2024 Annual Review' })
  @IsString()
  name!: string

  @ApiProperty({ example: 2024, minimum: 2020, maximum: 2100 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number

  @ApiProperty({ example: '2024-01-15T00:00:00Z' })
  @IsDateString()
  selfReviewDeadline!: string

  @ApiProperty({ example: '2024-02-01T00:00:00Z' })
  @IsDateString()
  peerFeedbackDeadline!: string

  @ApiProperty({ example: '2024-02-15T00:00:00Z' })
  @IsDateString()
  managerEvalDeadline!: string

  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  @IsDateString()
  calibrationDeadline!: string

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  @IsDateString()
  feedbackDeliveryDeadline!: string
}

export class UpdateReviewCycleRequestDto {
  @ApiPropertyOptional({ example: '2024 Annual Review - Updated' })
  @IsString()
  name?: string

  @ApiPropertyOptional({ example: '2024-01-20T00:00:00Z' })
  @IsDateString()
  selfReviewDeadline?: string

  @ApiPropertyOptional({ example: '2024-02-05T00:00:00Z' })
  @IsDateString()
  peerFeedbackDeadline?: string

  @ApiPropertyOptional({ example: '2024-02-20T00:00:00Z' })
  @IsDateString()
  managerEvalDeadline?: string

  @ApiPropertyOptional({ example: '2024-03-05T00:00:00Z' })
  @IsDateString()
  calibrationDeadline?: string

  @ApiPropertyOptional({ example: '2024-03-20T00:00:00Z' })
  @IsDateString()
  feedbackDeliveryDeadline?: string
}

export class ReviewCycleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: '2024 Annual Review' })
  name!: string

  @ApiProperty({ example: 2024 })
  year!: number

  @ApiProperty({ enum: ReviewCycleStatusDto, example: ReviewCycleStatusDto.ACTIVE })
  status!: ReviewCycleStatusDto

  @ApiProperty({ example: '2024-01-15T00:00:00Z' })
  selfReviewDeadline!: string

  @ApiProperty({ example: '2024-02-01T00:00:00Z' })
  peerFeedbackDeadline!: string

  @ApiProperty({ example: '2024-02-15T00:00:00Z' })
  managerEvalDeadline!: string

  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  calibrationDeadline!: string

  @ApiProperty({ example: '2024-03-15T00:00:00Z' })
  feedbackDeliveryDeadline!: string

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt!: string

  @ApiProperty({ example: '2024-01-02T00:00:00Z' })
  updatedAt!: string
}
