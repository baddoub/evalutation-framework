import { ApplicationException } from '../../../common/exceptions/application.exception'

export class TokenExpiredException extends ApplicationException {
  constructor(message: string = 'Token has expired') {
    super(message, 'TOKEN_EXPIRED')
    this.name = 'TokenExpiredException'
  }
}
