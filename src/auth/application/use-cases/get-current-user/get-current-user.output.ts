/**
 * Output DTO for GetCurrentUserUseCase
 *
 * Represents the user information returned to the client.
 */

import { UserDto } from '../../dto/user.dto'

export class GetCurrentUserOutput {
  constructor(public readonly user: UserDto) {}
}
