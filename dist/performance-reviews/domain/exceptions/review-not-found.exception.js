"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewNotFoundException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class ReviewNotFoundException extends domain_exception_1.DomainException {
    constructor(message = 'Review not found', code = 'REVIEW_NOT_FOUND') {
        super(message, code);
        this.name = 'ReviewNotFoundException';
    }
}
exports.ReviewNotFoundException = ReviewNotFoundException;
//# sourceMappingURL=review-not-found.exception.js.map