import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, Min, Max, MaxLength, ArrayMaxSize } from 'class-validator';

export class NominatePeersRequestDto {
  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
    description: 'Array of peer user IDs (max 5)',
    maxItems: 5
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  peerIds!: string[];
}

export class SubmitPeerFeedbackRequestDto {
  @ApiProperty({ example: 3, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  projectImpact!: number;

  @ApiProperty({ example: 2, minimum: 0, maximum: 4 })
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

  @ApiProperty({ example: 2, minimum: 0, maximum: 4 })
  @IsInt()
  @Min(0)
  @Max(4)
  peopleImpact!: number;

  @ApiProperty({
    example: 'Jane consistently delivers high-quality code...',
    maxLength: 2000
  })
  @IsString()
  @MaxLength(2000)
  comments!: string;
}

export class PeerNominationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  cycleId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  nomineeId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  peerId!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  peerEmail!: string;

  @ApiProperty({ example: 'John Doe' })
  peerName!: string;

  @ApiProperty({ example: 'PENDING' })
  status!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', nullable: true })
  submittedAt!: string | null;
}

export class PeerFeedbackResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  nominationId!: string;

  @ApiProperty({ example: 3 })
  projectImpact!: number;

  @ApiProperty({ example: 2 })
  direction!: number;

  @ApiProperty({ example: 4 })
  engineeringExcellence!: number;

  @ApiProperty({ example: 3 })
  operationalOwnership!: number;

  @ApiProperty({ example: 2 })
  peopleImpact!: number;

  @ApiProperty({ example: 'Jane consistently delivers high-quality code...' })
  comments!: string;

  @ApiProperty({ example: '2024-01-20T14:30:00Z' })
  submittedAt!: string;

  @ApiProperty({ example: '2024-01-20T14:30:00Z' })
  createdAt!: string;
}

export class AggregatedPeerFeedbackResponseDto {
  @ApiProperty({ example: 3.2 })
  avgProjectImpact!: number;

  @ApiProperty({ example: 2.8 })
  avgDirection!: number;

  @ApiProperty({ example: 3.6 })
  avgEngineeringExcellence!: number;

  @ApiProperty({ example: 3.0 })
  avgOperationalOwnership!: number;

  @ApiProperty({ example: 2.4 })
  avgPeopleImpact!: number;

  @ApiProperty({ example: 5 })
  totalResponses!: number;

  @ApiProperty({
    example: [
      'Jane consistently delivers high-quality code...',
      'Strong technical leadership...'
    ]
  })
  anonymousComments!: string[];
}
