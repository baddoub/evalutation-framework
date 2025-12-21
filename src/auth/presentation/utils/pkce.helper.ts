import * as crypto from 'crypto'

export class PkceHelper {
  /**
   * Generate a random code verifier for PKCE
   * @returns Base64URL-encoded random string (43-128 characters)
   */
  static generateCodeVerifier(): string {
    return this.base64URLEncode(crypto.randomBytes(32))
  }

  /**
   * Generate code challenge from code verifier using S256 method
   * @param verifier Code verifier string
   * @returns Base64URL-encoded SHA256 hash of verifier
   */
  static generateCodeChallenge(verifier: string): string {
    return this.base64URLEncode(crypto.createHash('sha256').update(verifier).digest())
  }

  /**
   * Generate a random state parameter for CSRF protection
   * @returns Random string
   */
  static generateState(): string {
    return this.base64URLEncode(crypto.randomBytes(16))
  }

  /**
   * Base64URL encoding (URL-safe base64)
   * @param buffer Buffer to encode
   * @returns Base64URL-encoded string
   */
  private static base64URLEncode(buffer: Buffer): string {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
}
