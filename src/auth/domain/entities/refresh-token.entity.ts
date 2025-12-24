import type { UserId } from '../value-objects/user-id.vo'
import { InvalidUserException } from '../exceptions/invalid-user.exception'

export interface RefreshTokenProps {
  id: string
  userId: UserId
  tokenHash: string
  used: boolean
  expiresAt: Date
  createdAt: Date
  revokedAt?: Date
}

/**
 * RefreshToken Entity
 *
 * Manages refresh tokens with rotation support for enhanced security.
 * Tracks usage and revocation to detect token theft.
 */
export class RefreshToken {
  private readonly _id: string
  private readonly _userId: UserId
  private readonly _tokenHash: string
  private _used: boolean
  private readonly _expiresAt: Date
  private readonly _createdAt: Date
  private _revokedAt?: Date

  private constructor(props: RefreshTokenProps) {
    this._id = props.id
    this._userId = props.userId
    this._tokenHash = props.tokenHash
    this._used = props.used
    this._expiresAt = props.expiresAt
    this._createdAt = props.createdAt
    this._revokedAt = props.revokedAt
  }

  /**
   * Factory method to create a new RefreshToken
   * Validates all business invariants
   */
  static create(props: RefreshTokenProps): RefreshToken {
    // Validate id
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidUserException('Refresh token ID is required')
    }

    // Validate tokenHash
    if (!props.tokenHash || props.tokenHash.trim().length === 0) {
      throw new InvalidUserException('Token hash is required')
    }

    // Validate expiration (must be in future at creation time)
    if (props.expiresAt <= props.createdAt) {
      throw new InvalidUserException('Expiration must be in future')
    }

    return new RefreshToken(props)
  }

  /**
   * Mark token as used (for rotation detection)
   * Once marked as used, it cannot be unmarked
   */
  markAsUsed(): void {
    this._used = true
  }

  /**
   * Revoke token (for theft detection)
   * Once revoked, it cannot be unrevoked
   */
  revoke(): void {
    // Only set revokedAt if not already revoked
    if (!this._revokedAt) {
      this._revokedAt = new Date()
    }
  }

  /**
   * Check if token has expired
   */
  isExpired(): boolean {
    return this._expiresAt <= new Date()
  }

  /**
   * Check if token is valid (not used, not revoked, not expired)
   */
  isValid(): boolean {
    return !this._used && !this._revokedAt && !this.isExpired()
  }

  // Getters
  get id(): string {
    return this._id
  }

  get userId(): UserId {
    return this._userId
  }

  get tokenHash(): string {
    return this._tokenHash
  }

  get used(): boolean {
    return this._used
  }

  get expiresAt(): Date {
    return this._expiresAt
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get revokedAt(): Date | undefined {
    return this._revokedAt
  }
}
