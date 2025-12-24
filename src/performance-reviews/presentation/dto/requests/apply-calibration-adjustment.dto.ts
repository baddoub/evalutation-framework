import { ApiProperty } from '@nestjs/swagger'
import { IsUUID, IsString, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PillarScoresDto } from './update-self-review.dto'

export class ApplyCalibrationAdjustmentDto {
  @ApiProperty({ example: 'eval-uuid' })
  @IsUUID()
  evaluationId!: string

  @ApiProperty({ type: PillarScoresDto })
  @ValidateNested()
  @Type(() => PillarScoresDto)
  adjustedScores!: PillarScoresDto

  @ApiProperty({
    example: 'Normalized direction score to align with peer performance in same level',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  justification!: string
}
