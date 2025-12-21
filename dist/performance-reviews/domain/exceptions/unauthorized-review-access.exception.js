"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedReviewAccessException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class UnauthorizedReviewAccessException extends domain_exception_1.DomainException {
    constructor(message = 'Unauthorized access to review data', code = 'UNAUTHORIZED_REVIEW_ACCESS') {
        super(message, code);
        this.name = 'UnauthorizedReviewAccessException';
    }
}
exports.UnauthorizedReviewAccessException = UnauthorizedReviewAccessException;
//# sourceMappingURL=unauthorized-review-access.exception.js.map