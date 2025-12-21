import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when an invalid state transition is attempted
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidStateTransitionException extends BusinessRuleViolationException {
  constructor(message: string, code: string = 'INVALID_STATE_TRANSITION') {
    super(message, code)
    this.name = 'InvalidStateTransitionException'
  }
}
