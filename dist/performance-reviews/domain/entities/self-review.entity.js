"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReview = void 0;
const self_review_id_vo_1 = require("../value-objects/self-review-id.vo");
const review_status_vo_1 = require("../value-objects/review-status.vo");
const self_review_already_submitted_exception_1 = require("../exceptions/self-review-already-submitted.exception");
class SelfReview {
    constructor(_id, _cycleId, _userId, _scores, _narrative, _status, _submittedAt) {
        this._id = _id;
        this._cycleId = _cycleId;
        this._userId = _userId;
        this._scores = _scores;
        this._narrative = _narrative;
        this._status = _status;
        this._submittedAt = _submittedAt;
    }
    static create(props) {
        return new SelfReview(props.id ?? self_review_id_vo_1.SelfReviewId.generate(), props.cycleId, props.userId, props.scores, props.narrative, review_status_vo_1.ReviewStatus.DRAFT);
    }
    updateScores(scores) {
        if (this.isSubmitted) {
            throw new self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException('Cannot update scores after submission');
        }
        this._scores = scores;
    }
    updateNarrative(narrative) {
        if (this.isSubmitted) {
            throw new self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException('Cannot update narrative after submission');
        }
        this._narrative = narrative;
    }
    submit() {
        if (this.isSubmitted) {
            throw new self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException();
        }
        this._status = review_status_vo_1.ReviewStatus.SUBMITTED;
        this._submittedAt = new Date();
    }
    get id() {
        return this._id;
    }
    get cycleId() {
        return this._cycleId;
    }
    get userId() {
        return this._userId;
    }
    get scores() {
        return this._scores;
    }
    get narrative() {
        return this._narrative;
    }
    get status() {
        return this._status;
    }
    get submittedAt() {
        return this._submittedAt;
    }
    get isSubmitted() {
        return this._status.equals(review_status_vo_1.ReviewStatus.SUBMITTED) || this._status.equals(review_status_vo_1.ReviewStatus.CALIBRATED);
    }
}
exports.SelfReview = SelfReview;
//# sourceMappingURL=self-review.entity.js.map