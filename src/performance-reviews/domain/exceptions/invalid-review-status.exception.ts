import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when review status validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidReviewStatusException extends DomainException {
  constructor(message: string, code: string = 'INVALID_REVIEW_STATUS') {
    super(message, code)
    this.name = 'InvalidReviewStatusException'
  }
}
