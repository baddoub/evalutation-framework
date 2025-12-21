import { NarrativeExceedsWordLimitException } from '../exceptions/narrative-exceeds-word-limit.exception'

/**
 * Narrative Value Object
 *
 * Responsibilities:
 * - Type-safe narrative text with 1000 word limit validation
 * - Immutable after creation
 * - Word count calculation
 *
 * SOLID Principles:
 * - SRP: Only responsible for narrative validation and representation
 * - Domain Layer: Zero dependencies on frameworks
 */
export class Narrative {
  private static readonly MAX_WORDS = 1000
  private readonly _text: string
  private readonly _wordCount: number

  private constructor(text: string) {
    this._text = text.trim()
    this._wordCount = this.calculateWordCount(this._text)

    if (this._wordCount > Narrative.MAX_WORDS) {
      throw new NarrativeExceedsWordLimitException(this._wordCount)
    }
  }

  /**
   * Create Narrative from text
   * @param text - Narrative text
   * @returns Narrative instance
   * @throws NarrativeExceedsWordLimitException if text exceeds 1000 words
   */
  static fromText(text: string): Narrative {
    if (!text || typeof text !== 'string') {
      return new Narrative('')
    }
    return new Narrative(text)
  }

  /**
   * Alias for fromText() - Create Narrative from text
   * @param text - Narrative text
   * @returns Narrative instance
   * @throws NarrativeExceedsWordLimitException if text exceeds 1000 words
   */
  static create(text: string): Narrative {
    return this.fromText(text)
  }

  /**
   * Calculate word count by splitting on whitespace
   * @param text - Text to count words
   * @returns Number of words
   */
  private calculateWordCount(text: string): number {
    if (!text || text.length === 0) {
      return 0
    }
    return text.split(/\s+/).filter((word) => word.length > 0).length
  }

  /**
   * Get narrative text
   */
  get text(): string {
    return this._text
  }

  /**
   * Get word count
   */
  get wordCount(): number {
    return this._wordCount
  }

  /**
   * Check equality with another Narrative
   * @param other - Narrative to compare with
   * @returns true if narratives are equal
   */
  equals(other: Narrative): boolean {
    if (!other) {
      return false
    }

    return this._text === other._text
  }

  /**
   * String representation of narrative
   * @returns narrative text
   */
  toString(): string {
    return this._text
  }
}
