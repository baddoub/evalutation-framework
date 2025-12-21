import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when attempting to aggregate peer feedback but none exists
 *
 * Domain Layer Exception - represents business rule violation
 */
export class NoPeerFeedbackException extends DomainException {
  constructor(message: string = 'No peer feedback available to aggregate', code: string = 'NO_PEER_FEEDBACK') {
    super(message, code)
    this.name = 'NoPeerFeedbackException'
  }
}
