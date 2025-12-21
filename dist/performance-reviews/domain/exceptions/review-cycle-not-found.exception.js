"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCycleNotFoundException = void 0;
class ReviewCycleNotFoundException extends Error {
    constructor(message = 'Review cycle not found') {
        super(message);
        this.name = 'ReviewCycleNotFoundException';
    }
}
exports.ReviewCycleNotFoundException = ReviewCycleNotFoundException;
//# sourceMappingURL=review-cycle-not-found.exception.js.map