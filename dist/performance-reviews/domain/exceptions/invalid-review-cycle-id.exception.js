"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidReviewCycleIdException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidReviewCycleIdException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_REVIEW_CYCLE_ID') {
        super(message, code);
        this.name = 'InvalidReviewCycleIdException';
    }
}
exports.InvalidReviewCycleIdException = InvalidReviewCycleIdException;
//# sourceMappingURL=invalid-review-cycle-id.exception.js.map