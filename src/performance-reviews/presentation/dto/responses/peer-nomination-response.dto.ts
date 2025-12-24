import { ApiProperty } from '@nestjs/swagger'

export class PeerNominationResponseDto {
  @ApiProperty({ example: 'nomination-uuid' })
  id!: string

  @ApiProperty({ example: 'user-uuid' })
  nomineeId!: string

  @ApiProperty({ example: 'Jane Doe' })
  nomineeName!: string

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'ACCEPTED', 'DECLINED'] })
  status!: string

  @ApiProperty({ example: '2025-02-14T10:00:00Z' })
  nominatedAt!: string
}

export class NominatePeersResponseDto {
  @ApiProperty({ type: [PeerNominationResponseDto] })
  nominations!: PeerNominationResponseDto[]
}
