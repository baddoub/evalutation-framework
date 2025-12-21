/**
 * InvalidTokenException
 *
 * Thrown when JWT token validation fails
 * Could be due to expiration, invalid signature, or malformed token
 */
export class InvalidTokenException extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'InvalidTokenException'
  }
}
