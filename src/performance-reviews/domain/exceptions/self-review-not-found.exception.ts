export class SelfReviewNotFoundException extends Error {
  constructor(message: string = 'Self review not found') {
    super(message)
    this.name = 'SelfReviewNotFoundException'
  }
}
