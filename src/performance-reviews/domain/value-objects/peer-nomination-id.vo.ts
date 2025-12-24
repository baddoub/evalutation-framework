import { v4 as uuidv4 } from 'uuid'

/**
 * PeerNominationId Value Object
 *
 * Represents a unique identifier for a peer nomination
 */
export class PeerNominationId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('PeerNominationId cannot be empty')
    }
  }

  get value(): string {
    return this._value
  }

  static generate(): PeerNominationId {
    return new PeerNominationId(uuidv4())
  }

  static fromString(value: string): PeerNominationId {
    return new PeerNominationId(value)
  }

  static create(value?: string): PeerNominationId {
    return new PeerNominationId(value || uuidv4())
  }

  equals(other: PeerNominationId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
