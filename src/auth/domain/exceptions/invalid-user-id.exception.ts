import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when UserId validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidUserIdException extends DomainException {
  constructor(message: string, code: string = 'INVALID_USER_ID') {
    super(message, code)
    this.name = 'InvalidUserIdException'
  }
}
