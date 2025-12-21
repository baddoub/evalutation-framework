import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class AuthorizationFailedException extends DomainException {
    constructor(message: string, code?: string);
}
