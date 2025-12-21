/**
 * Input DTO for RefreshTokensUseCase
 *
 * Represents the data required to refresh an access token.
 */

export class RefreshTokensInput {
  constructor(public readonly refreshToken: string) {}
}
