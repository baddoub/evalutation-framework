export class ManagerEvalDeadlinePassedException extends Error {
  constructor(message: string = 'Manager evaluation deadline has passed') {
    super(message)
    this.name = 'ManagerEvalDeadlinePassedException'
  }
}
