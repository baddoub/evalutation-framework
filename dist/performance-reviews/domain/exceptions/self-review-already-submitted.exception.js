"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReviewAlreadySubmittedException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class SelfReviewAlreadySubmittedException extends domain_exception_1.DomainException {
    constructor(message = 'Self review has already been submitted', code = 'SELF_REVIEW_ALREADY_SUBMITTED') {
        super(message, code);
        this.name = 'SelfReviewAlreadySubmittedException';
    }
}
exports.SelfReviewAlreadySubmittedException = SelfReviewAlreadySubmittedException;
//# sourceMappingURL=self-review-already-submitted.exception.js.map