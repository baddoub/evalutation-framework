import { DomainException } from '../../../common/exceptions/domain.exception';
export declare class NarrativeExceedsWordLimitException extends DomainException {
    constructor(wordCount: number, code?: string);
}
