export class ManagerEvaluationNotFoundException extends Error {
  constructor(message: string = 'Manager evaluation not found') {
    super(message)
    this.name = 'ManagerEvaluationNotFoundException'
  }
}
