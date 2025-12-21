import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exception';
export declare class InvalidStateTransitionException extends BusinessRuleViolationException {
    constructor(message: string, code?: string);
}
