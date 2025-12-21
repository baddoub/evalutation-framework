import { ApplicationException } from '../../../common/exceptions/application.exception'

export class TokenTheftDetectedException extends ApplicationException {
  constructor(message: string = 'Token reuse detected - all sessions revoked') {
    super(message, 'TOKEN_THEFT_DETECTED')
    this.name = 'TokenTheftDetectedException'
  }
}
