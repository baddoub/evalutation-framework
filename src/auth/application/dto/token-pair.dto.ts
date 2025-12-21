/**
 * Application Layer Data Transfer Object for Token Pair
 *
 * Represents an access token and refresh token pair returned to clients.
 */

export class TokenPairDto {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number, // Expiration time in seconds
  ) {}
}
