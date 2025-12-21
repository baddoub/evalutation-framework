import { DomainException } from '../../../common/exceptions/domain.exception'

export class AuthorizationFailedException extends DomainException {
  constructor(message: string, code: string = 'AUTHORIZATION_FAILED') {
    super(message, code)
    this.name = 'AuthorizationFailedException'
  }
}
