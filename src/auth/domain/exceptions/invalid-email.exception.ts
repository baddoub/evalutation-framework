import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when email validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidEmailException extends DomainException {
  constructor(message: string, code: string = 'INVALID_EMAIL') {
    super(message, code)
    this.name = 'InvalidEmailException'
  }
}
