import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUUID, IsDateString, IsArray, IsOptional } from 'class-validator'

export class CreateCalibrationSessionDto {
  @ApiProperty({ example: 'Platform Engineering Calibration' })
  @IsString()
  name!: string

  @ApiProperty({ example: 'Platform Engineering', required: false })
  @IsString()
  @IsOptional()
  department?: string

  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  facilitatorId!: string

  @ApiProperty({ example: ['manager-uuid-1', 'manager-uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds!: string[]

  @ApiProperty({ example: '2025-03-25T14:00:00Z' })
  @IsDateString()
  scheduledAt!: string
}
