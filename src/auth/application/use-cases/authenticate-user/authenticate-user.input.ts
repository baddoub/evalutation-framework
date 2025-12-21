/**
 * Input DTO for AuthenticateUserUseCase
 *
 * Represents the data required to authenticate a user via OAuth code exchange.
 */

export class AuthenticateUserInput {
  constructor(
    public readonly authorizationCode: string,
    public readonly codeVerifier: string,
    public readonly deviceId?: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
  ) {}
}
