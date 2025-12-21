import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when PillarScore validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidPillarScoreException extends DomainException {
  constructor(message: string = 'Pillar score must be an integer between 0 and 4', code: string = 'INVALID_PILLAR_SCORE') {
    super(message, code)
    this.name = 'InvalidPillarScoreException'
  }
}
