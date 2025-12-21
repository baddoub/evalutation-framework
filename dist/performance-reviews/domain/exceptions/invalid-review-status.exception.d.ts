import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidReviewStatusException extends DomainException {
    constructor(message: string, code?: string);
}
