import { BaseException } from './base.exception'

export abstract class DomainException extends BaseException {
  constructor(message: string, code: string) {
    super(message, code)
  }
}

export class InvalidValueObjectException extends DomainException {
  constructor(message: string, code: string = 'INVALID_VALUE_OBJECT') {
    super(message, code)
  }
}

export class EntityValidationException extends DomainException {
  constructor(message: string, code: string = 'ENTITY_VALIDATION_FAILED') {
    super(message, code)
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code)
  }
}
