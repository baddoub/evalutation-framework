export class ReviewNotFoundException extends Error {
  constructor(message = 'Review not found') {
    super(message)
    this.name = 'ReviewNotFoundException'
  }
}
