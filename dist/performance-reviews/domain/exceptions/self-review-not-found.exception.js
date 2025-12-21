"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReviewNotFoundException = void 0;
class SelfReviewNotFoundException extends Error {
    constructor(message = 'Self review not found') {
        super(message);
        this.name = 'SelfReviewNotFoundException';
    }
}
exports.SelfReviewNotFoundException = SelfReviewNotFoundException;
//# sourceMappingURL=self-review-not-found.exception.js.map