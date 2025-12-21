import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidReviewCycleIdException extends DomainException {
    constructor(message: string, code?: string);
}
