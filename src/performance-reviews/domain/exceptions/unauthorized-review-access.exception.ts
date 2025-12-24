import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when a user attempts unauthorized access to review data
 *
 * Domain Layer Exception - represents business rule violation
 */
export class UnauthorizedReviewAccessException extends DomainException {
  constructor(
    message: string = 'Unauthorized access to review data',
    code: string = 'UNAUTHORIZED_REVIEW_ACCESS',
  ) {
    super(message, code)
    this.name = 'UnauthorizedReviewAccessException'
  }
}
