"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidReviewCycleStatusException = void 0;
class InvalidReviewCycleStatusException extends Error {
    constructor(message = 'Invalid review cycle status') {
        super(message);
        this.name = 'InvalidReviewCycleStatusException';
    }
}
exports.InvalidReviewCycleStatusException = InvalidReviewCycleStatusException;
//# sourceMappingURL=invalid-review-cycle-status.exception.js.map