/**
 * Output DTO for RefreshTokensUseCase
 *
 * Represents the new token pair after successful refresh.
 */

export class RefreshTokensOutput {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number,
  ) {}
}
