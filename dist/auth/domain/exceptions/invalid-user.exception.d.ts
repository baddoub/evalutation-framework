import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidUserException extends DomainException {
    constructor(message: string, code?: string);
}
