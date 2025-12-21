import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidCycleDeadlinesException extends DomainException {
    constructor(message: string, code?: string);
}
