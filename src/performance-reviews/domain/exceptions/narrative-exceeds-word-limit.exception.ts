export class NarrativeExceedsWordLimitException extends Error {
  constructor(
    public readonly wordCount: number,
    public readonly maxWords = 1000,
  ) {
    super(`Narrative exceeds ${maxWords} word limit (current: ${wordCount} words)`)
    this.name = 'NarrativeExceedsWordLimitException'
  }
}
