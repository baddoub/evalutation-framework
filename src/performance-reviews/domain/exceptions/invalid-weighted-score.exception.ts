import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when WeightedScore validation fails
 *
 * Domain Layer Exception - represents business rule violation
 */
export class InvalidWeightedScoreException extends DomainException {
  constructor(message: string = 'Weighted score must be between 0 and 4', code: string = 'INVALID_WEIGHTED_SCORE') {
    super(message, code)
    this.name = 'InvalidWeightedScoreException'
  }
}
