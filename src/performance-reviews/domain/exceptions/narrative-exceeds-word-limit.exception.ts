import { DomainException } from '../../../common/exceptions/domain.exception'

/**
 * Exception thrown when narrative text exceeds the 1000 word limit
 *
 * Domain Layer Exception - represents business rule violation
 */
export class NarrativeExceedsWordLimitException extends DomainException {
  constructor(wordCount: number, code: string = 'NARRATIVE_EXCEEDS_WORD_LIMIT') {
    super(`Narrative exceeds 1000 word limit. Current: ${wordCount} words`, code)
    this.name = 'NarrativeExceedsWordLimitException'
  }
}
