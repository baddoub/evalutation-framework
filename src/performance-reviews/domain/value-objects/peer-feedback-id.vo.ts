import { randomUUID } from 'crypto'

/**
 * PeerFeedbackId Value Object
 *
 * Represents a unique identifier for peer feedback.
 * Uses UUID v4 for globally unique IDs.
 */
export class PeerFeedbackId {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  /**
   * Generate a new random PeerFeedbackId
   */
  static generate(): PeerFeedbackId {
    return new PeerFeedbackId(randomUUID())
  }

  /**
   * Create PeerFeedbackId from existing string value
   */
  static fromString(id: string): PeerFeedbackId {
    return new PeerFeedbackId(id)
  }

  /**
   * Get the string value of the ID
   */
  get value(): string {
    return this._value
  }

  /**
   * Check equality with another PeerFeedbackId
   */
  equals(other: PeerFeedbackId): boolean {
    if (!other) return false
    return this._value === other._value
  }
}
