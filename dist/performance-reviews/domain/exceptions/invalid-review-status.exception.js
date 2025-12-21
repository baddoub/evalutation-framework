"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidReviewStatusException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidReviewStatusException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_REVIEW_STATUS') {
        super(message, code);
        this.name = 'InvalidReviewStatusException';
    }
}
exports.InvalidReviewStatusException = InvalidReviewStatusException;
//# sourceMappingURL=invalid-review-status.exception.js.map