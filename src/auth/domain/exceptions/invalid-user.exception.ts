import { DomainException } from '../../../common/exceptions/domain.exception'

export class InvalidUserException extends DomainException {
  constructor(message: string, code: string = 'INVALID_USER') {
    super(message, code)
    this.name = 'InvalidUserException'
  }
}
