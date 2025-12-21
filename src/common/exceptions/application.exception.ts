import { BaseException } from './base.exception'

export abstract class ApplicationException extends BaseException {
  constructor(message: string, code: string) {
    super(message, code)
  }
}

export class UseCaseException extends ApplicationException {
  constructor(message: string, code: string = 'USE_CASE_ERROR') {
    super(message, code)
  }
}

export class ResourceNotFoundException extends ApplicationException {
  constructor(message: string, code: string = 'RESOURCE_NOT_FOUND') {
    super(message, code)
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, code)
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, code)
  }
}

export class ValidationException extends ApplicationException {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code)
  }
}
