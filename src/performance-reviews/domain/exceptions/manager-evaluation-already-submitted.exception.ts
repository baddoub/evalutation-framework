import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when attempting to submit an already submitted manager evaluation
 *
 * Domain Layer Exception - represents business rule violation
 */
export class ManagerEvaluationAlreadySubmittedException extends DomainException {
  constructor(
    message: string = 'Manager evaluation has already been submitted',
    code: string = 'MANAGER_EVALUATION_ALREADY_SUBMITTED',
  ) {
    super(message, code)
    this.name = 'ManagerEvaluationAlreadySubmittedException'
  }
}
