export class CannotNominateSelfException extends Error {
  constructor(message = 'Cannot nominate yourself for peer feedback') {
    super(message)
    this.name = 'CannotNominateSelfException'
  }
}
