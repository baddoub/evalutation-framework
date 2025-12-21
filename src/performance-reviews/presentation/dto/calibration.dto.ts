import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export enum CalibrationStatusDto {
  DRAFT = 'DRAFT',
  IN_CALIBRATION = 'IN_CALIBRATION',
  CALIBRATED = 'CALIBRATED',
  LOCKED = 'LOCKED',
}

export class RecordCalibrationNoteRequestDto {
  @ApiProperty({
    example: 'Discussed with Jane Smith and Bob Johnson. Agreed to adjust scores...',
    maxLength: 2000
  })
  @IsString()
  @MaxLength(2000)
  notes!: string;
}

export class ApplyCalibrationAdjustmentRequestDto {
  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact!: number;

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  direction!: number;

  @ApiProperty({ example: 4, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  engineeringExcellence!: number;

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  operationalOwnership!: number;

  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact!: number;

  @ApiProperty({
    example: 'Adjusted after calibration meeting on 2024-03-01',
    maxLength: 1000
  })
  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class CalibrationSessionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  cycleId!: string;

  @ApiProperty({ example: 'Engineering Department' })
  department!: string;

  @ApiProperty({ enum: CalibrationStatusDto, example: CalibrationStatusDto.IN_CALIBRATION })
  status!: CalibrationStatusDto;

  @ApiProperty({ example: 'Discussed initial scores with all managers...' })
  notes!: string;

  @ApiProperty({ example: '2024-03-01T10:00:00Z', nullable: true })
  lockedAt!: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true })
  lockedBy!: string | null;

  @ApiProperty({ example: '2024-02-25T00:00:00Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-03-01T10:00:00Z' })
  updatedAt!: string;
}

export class CalibrationAdjustmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  sessionId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  managerEvaluationId!: string;

  @ApiProperty({ example: 3 })
  previousProjectImpact!: number;

  @ApiProperty({ example: 3 })
  adjustedProjectImpact!: number;

  @ApiProperty({ example: 2 })
  previousDirection!: number;

  @ApiProperty({ example: 3 })
  adjustedDirection!: number;

  @ApiProperty({ example: 'Adjusted after calibration meeting' })
  reason!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  adjustedBy!: string;

  @ApiProperty({ example: '2024-03-01T14:30:00Z' })
  createdAt!: string;
}
