export class ReviewAlreadySubmittedException extends Error {
  constructor(message = 'Review has already been submitted') {
    super(message)
    this.name = 'ReviewAlreadySubmittedException'
  }
}
