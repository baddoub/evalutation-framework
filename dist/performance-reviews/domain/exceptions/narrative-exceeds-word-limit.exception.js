"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeExceedsWordLimitException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class NarrativeExceedsWordLimitException extends domain_exception_1.DomainException {
    constructor(wordCount, code = 'NARRATIVE_EXCEEDS_WORD_LIMIT') {
        super(`Narrative exceeds 1000 word limit. Current: ${wordCount} words`, code);
        this.name = 'NarrativeExceedsWordLimitException';
    }
}
exports.NarrativeExceedsWordLimitException = NarrativeExceedsWordLimitException;
//# sourceMappingURL=narrative-exceeds-word-limit.exception.js.map