import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when attempting to modify a locked final score
 *
 * Domain Layer Exception - represents business rule violation
 */
export class FinalScoreLockedException extends DomainException {
  constructor(
    message: string = 'Final score is locked and cannot be modified',
    code: string = 'FINAL_SCORE_LOCKED',
  ) {
    super(message, code)
    this.name = 'FinalScoreLockedException'
  }
}
