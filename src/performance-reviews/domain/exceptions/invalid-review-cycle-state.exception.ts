import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when a review cycle state transition is invalid
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidReviewCycleStateException extends DomainException {
  constructor(message: string, code: string = 'INVALID_REVIEW_CYCLE_STATE') {
    super(message, code)
    this.name = 'InvalidReviewCycleStateException'
  }
}
