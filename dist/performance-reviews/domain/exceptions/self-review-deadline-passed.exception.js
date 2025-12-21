"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReviewDeadlinePassedException = void 0;
class SelfReviewDeadlinePassedException extends Error {
    constructor(message = 'Self review deadline has passed') {
        super(message);
        this.name = 'SelfReviewDeadlinePassedException';
    }
}
exports.SelfReviewDeadlinePassedException = SelfReviewDeadlinePassedException;
//# sourceMappingURL=self-review-deadline-passed.exception.js.map