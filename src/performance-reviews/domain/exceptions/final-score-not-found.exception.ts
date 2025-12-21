export class FinalScoreNotFoundException extends Error {
  constructor(message: string = 'Final score not found') {
    super(message)
    this.name = 'FinalScoreNotFoundException'
  }
}
