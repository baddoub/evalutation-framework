import { BaseException } from './base.exception';
export declare abstract class DomainException extends BaseException {
    constructor(message: string, code: string);
}
export declare class InvalidValueObjectException extends DomainException {
    constructor(message: string, code?: string);
}
export declare class EntityValidationException extends DomainException {
    constructor(message: string, code?: string);
}
export declare class BusinessRuleViolationException extends DomainException {
    constructor(message: string, code?: string);
}
