"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPillarScoreException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidPillarScoreException extends domain_exception_1.DomainException {
    constructor(message = 'Pillar score must be an integer between 0 and 4', code = 'INVALID_PILLAR_SCORE') {
        super(message, code);
        this.name = 'InvalidPillarScoreException';
    }
}
exports.InvalidPillarScoreException = InvalidPillarScoreException;
//# sourceMappingURL=invalid-pillar-score.exception.js.map