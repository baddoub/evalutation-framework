import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when cycle deadlines are invalid
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidCycleDeadlinesException extends DomainException {
  constructor(message: string, code: string = 'INVALID_CYCLE_DEADLINES') {
    super(message, code)
    this.name = 'InvalidCycleDeadlinesException'
  }
}
