export class ReviewCycleNotFoundException extends Error {
  constructor(message: string = 'Review cycle not found') {
    super(message)
    this.name = 'ReviewCycleNotFoundException'
  }
}
