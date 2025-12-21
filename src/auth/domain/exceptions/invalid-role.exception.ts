import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when role validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidRoleException extends DomainException {
  constructor(message: string, code: string = 'INVALID_ROLE') {
    super(message, code)
    this.name = 'InvalidRoleException'
  }
}
