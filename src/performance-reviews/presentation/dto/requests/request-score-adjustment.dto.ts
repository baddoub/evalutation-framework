import { ApiProperty } from '@nestjs/swagger'
import { IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PillarScoresDto } from './update-self-review.dto'

export class RequestScoreAdjustmentDto {
  @ApiProperty({ example: 'New project completion after calibration warrants score increase' })
  @IsString()
  reason!: string

  @ApiProperty({ type: PillarScoresDto })
  @ValidateNested()
  @Type(() => PillarScoresDto)
  proposedScores!: PillarScoresDto
}
