export class CalibrationDeadlinePassedException extends Error {
  constructor(message: string = 'Calibration deadline has passed') {
    super(message)
    this.name = 'CalibrationDeadlinePassedException'
  }
}
