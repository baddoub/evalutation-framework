import { ApplicationException } from '../../../common/exceptions/application.exception'

export class UserDeactivatedException extends ApplicationException {
  constructor(message: string = 'User account is deactivated') {
    super(message, 'USER_DEACTIVATED')
    this.name = 'UserDeactivatedException'
  }
}
