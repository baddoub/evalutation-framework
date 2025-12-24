import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString, ValidateIf } from 'class-validator'

export enum AdjustmentAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewScoreAdjustmentDto {
  @ApiProperty({ example: 'APPROVED', enum: AdjustmentAction })
  @IsEnum(AdjustmentAction)
  action!: AdjustmentAction

  @ApiProperty({ example: 'Not enough justification provided', required: false })
  @ValidateIf((o) => o.action === 'REJECTED')
  @IsString()
  rejectionReason?: string
}
