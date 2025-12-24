import { randomUUID } from 'crypto'

/**
 * CalibrationSessionId Value Object
 *
 * Represents a unique identifier for a calibration session
 */
export class CalibrationSessionId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('CalibrationSessionId cannot be empty')
    }
  }

  get value(): string {
    return this._value
  }

  static create(value?: string): CalibrationSessionId {
    return new CalibrationSessionId(value || randomUUID())
  }

  static fromString(value: string): CalibrationSessionId {
    return new CalibrationSessionId(value)
  }

  equals(other: CalibrationSessionId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
