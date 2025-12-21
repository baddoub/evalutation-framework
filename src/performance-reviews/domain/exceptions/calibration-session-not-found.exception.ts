export class CalibrationSessionNotFoundException extends Error {
  constructor(message: string = 'Calibration session not found') {
    super(message)
    this.name = 'CalibrationSessionNotFoundException'
  }
}
