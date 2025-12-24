import { ApiProperty } from '@nestjs/swagger'
import { IsUUID, IsString, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PillarScoresDto } from './update-self-review.dto'

export class SubmitPeerFeedbackDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  revieweeId!: string

  @ApiProperty({ type: PillarScoresDto })
  @ValidateNested()
  @Type(() => PillarScoresDto)
  scores!: PillarScoresDto

  @ApiProperty({
    example: 'Alice demonstrates exceptional technical leadership...',
    required: false,
  })
  @IsString()
  @IsOptional()
  strengths?: string

  @ApiProperty({
    example: 'Could improve communication in cross-team settings...',
    required: false,
  })
  @IsString()
  @IsOptional()
  growthAreas?: string

  @ApiProperty({ example: 'Strong performer overall', required: false })
  @IsString()
  @IsOptional()
  generalComments?: string
}
