import { ApiProperty } from '@nestjs/swagger'
import { IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PillarScoresDto } from './update-self-review.dto'

export class SubmitManagerEvaluationDto {
  @ApiProperty({ type: PillarScoresDto })
  @ValidateNested()
  @Type(() => PillarScoresDto)
  scores!: PillarScoresDto

  @ApiProperty({ example: 'Alice had a strong year...' })
  @IsString()
  narrative!: string

  @ApiProperty({ example: 'Technical excellence, mentorship' })
  @IsString()
  strengths!: string

  @ApiProperty({ example: 'Strategic thinking, cross-team communication' })
  @IsString()
  growthAreas!: string

  @ApiProperty({ example: 'Focus on architecture design, lead cross-org initiative' })
  @IsString()
  developmentPlan!: string
}
