export class UnauthorizedAccessException extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedAccessException'
  }
}
