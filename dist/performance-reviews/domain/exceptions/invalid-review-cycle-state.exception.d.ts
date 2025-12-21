import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidReviewCycleStateException extends DomainException {
    constructor(message: string, code?: string);
}
