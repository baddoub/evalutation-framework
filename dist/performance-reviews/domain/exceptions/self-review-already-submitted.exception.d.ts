import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class SelfReviewAlreadySubmittedException extends DomainException {
    constructor(message?: string, code?: string);
}
