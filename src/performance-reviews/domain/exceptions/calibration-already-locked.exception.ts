export class CalibrationAlreadyLockedException extends Error {
  constructor(message: string = 'Calibration session is already locked') {
    super(message)
    this.name = 'CalibrationAlreadyLockedException'
  }
}
