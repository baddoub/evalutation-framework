export class SelfReviewDeadlinePassedException extends Error {
  constructor(message: string = 'Self review deadline has passed') {
    super(message)
    this.name = 'SelfReviewDeadlinePassedException'
  }
}
