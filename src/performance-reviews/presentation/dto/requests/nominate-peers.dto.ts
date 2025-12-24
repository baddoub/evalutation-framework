import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator'
import { IsEmailOrUUID } from '../../validators/is-email-or-uuid.validator'

export class NominatePeersDto {
  @ApiProperty({
    example: ['user-uuid-1', 'user@example.com', 'another-uuid'],
    description: 'Array of 3-5 peer user IDs (UUID) or email addresses',
    minItems: 3,
    maxItems: 5,
  })
  @IsArray()
  @IsEmailOrUUID({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(5)
  nomineeIds!: string[]
}
