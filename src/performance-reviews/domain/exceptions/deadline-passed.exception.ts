export class DeadlinePassedException extends Error {
  constructor(
    public readonly deadline: Date,
    message = 'Deadline has passed',
  ) {
    super(message)
    this.name = 'DeadlinePassedException'
  }
}
