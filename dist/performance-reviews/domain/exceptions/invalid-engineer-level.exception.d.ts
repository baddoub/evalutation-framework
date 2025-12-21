import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class InvalidEngineerLevelException extends DomainException {
    constructor(message: string, code?: string);
}
