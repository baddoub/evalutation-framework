"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidReviewCycleStateException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidReviewCycleStateException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_REVIEW_CYCLE_STATE') {
        super(message, code);
        this.name = 'InvalidReviewCycleStateException';
    }
}
exports.InvalidReviewCycleStateException = InvalidReviewCycleStateException;
//# sourceMappingURL=invalid-review-cycle-state.exception.js.map