import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when attempting to submit an already submitted self review
 *
 * Domain Layer Exception - represents business rule violation
 */
export class SelfReviewAlreadySubmittedException extends DomainException {
  constructor(
    message: string = 'Self review has already been submitted',
    code: string = 'SELF_REVIEW_ALREADY_SUBMITTED',
  ) {
    super(message, code)
    this.name = 'SelfReviewAlreadySubmittedException'
  }
}
