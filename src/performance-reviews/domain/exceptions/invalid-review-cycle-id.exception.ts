import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when ReviewCycleId validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidReviewCycleIdException extends DomainException {
  constructor(message: string, code: string = 'INVALID_REVIEW_CYCLE_ID') {
    super(message, code)
    this.name = 'InvalidReviewCycleIdException'
  }
}
