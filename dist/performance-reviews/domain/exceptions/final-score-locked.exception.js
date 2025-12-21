"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScoreLockedException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class FinalScoreLockedException extends domain_exception_1.DomainException {
    constructor(message = 'Final score is locked and cannot be modified', code = 'FINAL_SCORE_LOCKED') {
        super(message, code);
        this.name = 'FinalScoreLockedException';
    }
}
exports.FinalScoreLockedException = FinalScoreLockedException;
//# sourceMappingURL=final-score-locked.exception.js.map