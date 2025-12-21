import { BaseException } from './base.exception';
export declare abstract class ApplicationException extends BaseException {
    constructor(message: string, code: string);
}
export declare class UseCaseException extends ApplicationException {
    constructor(message: string, code?: string);
}
export declare class ResourceNotFoundException extends ApplicationException {
    constructor(message: string, code?: string);
}
export declare class UnauthorizedException extends ApplicationException {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenException extends ApplicationException {
    constructor(message?: string, code?: string);
}
export declare class ValidationException extends ApplicationException {
    constructor(message: string, code?: string);
}
