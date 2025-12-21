import { randomUUID } from 'crypto'

/**
 * ManagerEvaluationId Value Object
 *
 * Represents a unique identifier for a manager evaluation
 */
export class ManagerEvaluationId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('ManagerEvaluationId cannot be empty')
    }
  }

  get value(): string {
    return this._value
  }

  static create(value?: string): ManagerEvaluationId {
    return new ManagerEvaluationId(value || randomUUID())
  }

  static fromString(value: string): ManagerEvaluationId {
    return new ManagerEvaluationId(value)
  }

  static generate(): ManagerEvaluationId {
    return new ManagerEvaluationId(randomUUID())
  }

  equals(other: ManagerEvaluationId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
