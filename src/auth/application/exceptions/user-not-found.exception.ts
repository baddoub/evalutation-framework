import { ApplicationException } from '../../../common/exceptions/application.exception'

export class UserNotFoundException extends ApplicationException {
  constructor(message: string = 'User not found') {
    super(message, 'USER_NOT_FOUND')
    this.name = 'UserNotFoundException'
  }
}
