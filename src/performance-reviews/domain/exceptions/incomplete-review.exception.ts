export class IncompleteReviewException extends Error {
  constructor(message = 'Cannot submit incomplete review') {
    super(message)
    this.name = 'IncompleteReviewException'
  }
}
