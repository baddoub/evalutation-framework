import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidEmailException extends DomainException {
    constructor(message: string, code?: string);
}
