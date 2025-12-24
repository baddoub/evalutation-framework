export class CannotNominateManagerException extends Error {
  constructor(message = 'Cannot nominate your manager for peer feedback') {
    super(message)
    this.name = 'CannotNominateManagerException'
  }
}
