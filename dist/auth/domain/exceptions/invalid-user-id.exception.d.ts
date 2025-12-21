import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidUserIdException extends DomainException {
    constructor(message: string, code?: string);
}
