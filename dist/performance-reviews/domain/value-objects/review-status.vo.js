"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewStatus = void 0;
class ReviewStatus {
    constructor(value) {
        this._value = value;
    }
    static fromString(status) {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'DRAFT':
                return ReviewStatus.DRAFT;
            case 'SUBMITTED':
                return ReviewStatus.SUBMITTED;
            case 'CALIBRATED':
                return ReviewStatus.CALIBRATED;
            default:
                throw new Error(`Invalid review status: ${status}`);
        }
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.ReviewStatus = ReviewStatus;
ReviewStatus.DRAFT = new ReviewStatus('DRAFT');
ReviewStatus.SUBMITTED = new ReviewStatus('SUBMITTED');
ReviewStatus.CALIBRATED = new ReviewStatus('CALIBRATED');
//# sourceMappingURL=review-status.vo.js.map