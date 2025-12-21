"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidWeightedScoreException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidWeightedScoreException extends domain_exception_1.DomainException {
    constructor(message = 'Weighted score must be between 0 and 4', code = 'INVALID_WEIGHTED_SCORE') {
        super(message, code);
        this.name = 'InvalidWeightedScoreException';
    }
}
exports.InvalidWeightedScoreException = InvalidWeightedScoreException;
//# sourceMappingURL=invalid-weighted-score.exception.js.map