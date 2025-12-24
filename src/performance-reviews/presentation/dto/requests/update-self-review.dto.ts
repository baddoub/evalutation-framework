import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsString, Min, Max, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { MaxWords } from '../../validators/max-words.validator'

class PillarScoresDto {
  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact!: number

  @ApiProperty({ example: 2, minimum: 0, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  direction!: number

  @ApiProperty({ example: 4, minimum: 0, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  engineeringExcellence!: number

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  operationalOwnership!: number

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact!: number
}

export class UpdateSelfReviewDto {
  @ApiProperty({ type: PillarScoresDto })
  @ValidateNested()
  @Type(() => PillarScoresDto)
  scores!: PillarScoresDto

  @ApiProperty({ example: 'This year, I focused on improving our CI/CD pipeline...' })
  @IsString()
  @MaxWords(1000)
  narrative!: string
}

export { PillarScoresDto }
