/**
 * Output DTO for AuthenticateUserUseCase
 *
 * Represents the authentication result returned to the client.
 */

import { UserDto } from '../../dto/user.dto'

export class AuthenticateUserOutput {
  constructor(
    public readonly user: UserDto,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number,
  ) {}
}
