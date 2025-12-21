export class ScoreAdjustmentRequestNotFoundException extends Error {
  constructor(message: string = 'Score adjustment request not found') {
    super(message)
    this.name = 'ScoreAdjustmentRequestNotFoundException'
  }
}
