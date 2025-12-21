import { v4 as uuidv4 } from 'uuid';

/**
 * ScoreAdjustmentRequestId Value Object
 *
 * Represents a unique identifier for a score adjustment request
 */
export class ScoreAdjustmentRequestId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('ScoreAdjustmentRequestId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  static generate(): ScoreAdjustmentRequestId {
    return new ScoreAdjustmentRequestId(uuidv4());
  }

  static fromString(value: string): ScoreAdjustmentRequestId {
    return new ScoreAdjustmentRequestId(value);
  }

  static create(value?: string): ScoreAdjustmentRequestId {
    return new ScoreAdjustmentRequestId(value || uuidv4());
  }

  equals(other: ScoreAdjustmentRequestId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
