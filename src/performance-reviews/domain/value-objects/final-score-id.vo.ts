import { randomUUID } from 'crypto'

/**
 * FinalScoreId Value Object
 *
 * Represents a unique identifier for a final score
 */
export class FinalScoreId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('FinalScoreId cannot be empty')
    }
  }

  get value(): string {
    return this._value
  }

  static generate(): FinalScoreId {
    return new FinalScoreId(randomUUID())
  }

  static fromString(value: string): FinalScoreId {
    return new FinalScoreId(value)
  }

  static create(value?: string): FinalScoreId {
    return new FinalScoreId(value || randomUUID())
  }

  equals(other: FinalScoreId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
