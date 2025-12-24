import type { UserId } from '../value-objects/user-id.vo'
import { InvalidUserException } from '../exceptions/invalid-user.exception'

export interface SessionProps {
  id: string
  userId: UserId
  deviceId: string | null
  userAgent: string | null
  ipAddress: string | null
  expiresAt: Date
  createdAt: Date
  lastUsed: Date
}

/**
 * Session Entity
 *
 * Tracks active user sessions for security monitoring and
 * concurrent session management.
 */
export class Session {
  private readonly _id: string
  private readonly _userId: UserId
  private readonly _deviceId: string | null
  private readonly _userAgent: string | null
  private readonly _ipAddress: string | null
  private readonly _expiresAt: Date
  private readonly _createdAt: Date
  private _lastUsed: Date

  private constructor(props: SessionProps) {
    this._id = props.id
    this._userId = props.userId
    this._deviceId = props.deviceId
    this._userAgent = props.userAgent
    this._ipAddress = props.ipAddress
    this._expiresAt = props.expiresAt
    this._createdAt = props.createdAt
    this._lastUsed = props.lastUsed
  }

  /**
   * Factory method to create a new Session
   * Validates all business invariants
   */
  static create(props: SessionProps): Session {
    // Validate id
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidUserException('Session ID is required')
    }

    // Validate expiration (must be in future at creation time)
    if (props.expiresAt <= props.createdAt) {
      throw new InvalidUserException('Session expiration in past')
    }

    // Validate userAgent length
    if (props.userAgent && props.userAgent.length > 500) {
      throw new InvalidUserException('User agent string too long')
    }

    // Validate IP address format (basic validation)
    if (props.ipAddress && !Session.isValidIpAddress(props.ipAddress)) {
      throw new InvalidUserException('Invalid IP address format')
    }

    return new Session(props)
  }

  /**
   * Check if session has expired
   */
  isExpired(): boolean {
    return this._expiresAt <= new Date()
  }

  /**
   * Update last activity timestamp
   */
  updateLastUsed(): void {
    this._lastUsed = new Date()
  }

  /**
   * Check if session is from the same device
   */
  isFromSameDevice(deviceId: string | null): boolean {
    // Both null
    if (this._deviceId === null && deviceId === null) {
      return true
    }

    // One is null, other is not
    if (this._deviceId === null || deviceId === null) {
      return false
    }

    return this._deviceId === deviceId
  }

  /**
   * Validate IP address format (basic validation)
   * Supports both IPv4 and IPv6
   */
  private static isValidIpAddress(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  // Getters
  get id(): string {
    return this._id
  }

  get userId(): UserId {
    return this._userId
  }

  get deviceId(): string | null {
    return this._deviceId
  }

  get userAgent(): string | null {
    return this._userAgent
  }

  get ipAddress(): string | null {
    return this._ipAddress
  }

  get expiresAt(): Date {
    return this._expiresAt
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get lastUsed(): Date {
    return this._lastUsed
  }
}
