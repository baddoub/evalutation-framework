export class ReviewCycleNotFoundException extends Error {
  constructor(message = 'Review cycle not found') {
    super(message)
    this.name = 'ReviewCycleNotFoundException'
  }
}
