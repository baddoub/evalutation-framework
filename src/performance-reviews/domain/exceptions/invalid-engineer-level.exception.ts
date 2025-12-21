import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when EngineerLevel validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidEngineerLevelException extends DomainException {
  constructor(message: string, code: string = 'INVALID_ENGINEER_LEVEL') {
    super(message, code)
    this.name = 'InvalidEngineerLevelException'
  }
}
