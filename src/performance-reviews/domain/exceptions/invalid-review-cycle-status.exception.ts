export class InvalidReviewCycleStatusException extends Error {
  constructor(message: string = 'Invalid review cycle status') {
    super(message)
    this.name = 'InvalidReviewCycleStatusException'
  }
}
