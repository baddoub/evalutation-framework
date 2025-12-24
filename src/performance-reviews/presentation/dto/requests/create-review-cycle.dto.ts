import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsInt, IsDateString, ValidateNested, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

class CycleDeadlinesDto {
  @ApiProperty({ example: '2025-02-15T23:59:59Z' })
  @IsDateString()
  selfReview!: string

  @ApiProperty({ example: '2025-03-01T23:59:59Z' })
  @IsDateString()
  peerFeedback!: string

  @ApiProperty({ example: '2025-03-15T23:59:59Z' })
  @IsDateString()
  managerEval!: string

  @ApiProperty({ example: '2025-03-30T23:59:59Z' })
  @IsDateString()
  calibration!: string

  @ApiProperty({ example: '2025-04-15T23:59:59Z' })
  @IsDateString()
  feedbackDelivery!: string
}

export class CreateReviewCycleDto {
  @ApiProperty({ example: '2025 Annual Review', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(new Date().getFullYear())
  year!: number

  @ApiProperty({ type: CycleDeadlinesDto })
  @ValidateNested()
  @Type(() => CycleDeadlinesDto)
  deadlines!: CycleDeadlinesDto

  @ApiProperty({ example: '2025-02-01T00:00:00Z' })
  @IsDateString()
  startDate!: string
}
