import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidRoleException extends DomainException {
    constructor(message: string, code?: string);
}
