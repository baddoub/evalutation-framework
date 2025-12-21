import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when a review entity is not found
 *
 * Domain Layer Exception - represents business rule violation
 */
export class ReviewNotFoundException extends DomainException {
  constructor(message: string = 'Review not found', code: string = 'REVIEW_NOT_FOUND') {
    super(message, code)
    this.name = 'ReviewNotFoundException'
  }
}
