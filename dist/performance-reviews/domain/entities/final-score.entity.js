"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScore = exports.FinalScoreId = void 0;
const final_score_id_vo_1 = require("../value-objects/final-score-id.vo");
const final_score_locked_exception_1 = require("../exceptions/final-score-locked.exception");
var final_score_id_vo_2 = require("../value-objects/final-score-id.vo");
Object.defineProperty(exports, "FinalScoreId", { enumerable: true, get: function () { return final_score_id_vo_2.FinalScoreId; } });
class FinalScore {
    constructor(_id, _cycleId, _userId, _pillarScores, _weightedScore, _finalLevel, _peerAverageScores, _peerFeedbackCount, _locked, _lockedAt, _feedbackDelivered = false, _feedbackDeliveredAt, _calculatedAt = new Date(), _feedbackNotes, _deliveredAt, _deliveredBy) {
        this._id = _id;
        this._cycleId = _cycleId;
        this._userId = _userId;
        this._pillarScores = _pillarScores;
        this._weightedScore = _weightedScore;
        this._finalLevel = _finalLevel;
        this._peerAverageScores = _peerAverageScores;
        this._peerFeedbackCount = _peerFeedbackCount;
        this._locked = _locked;
        this._lockedAt = _lockedAt;
        this._feedbackDelivered = _feedbackDelivered;
        this._feedbackDeliveredAt = _feedbackDeliveredAt;
        this._calculatedAt = _calculatedAt;
        this._feedbackNotes = _feedbackNotes;
        this._deliveredAt = _deliveredAt;
        this._deliveredBy = _deliveredBy;
    }
    static create(props) {
        return new FinalScore(props.id ?? final_score_id_vo_1.FinalScoreId.generate(), props.cycleId, props.userId, props.pillarScores, props.weightedScore, props.finalLevel, props.peerAverageScores ?? null, props.peerFeedbackCount ?? 0, false, undefined, false, undefined, props.calculatedAt ?? new Date(), props.feedbackNotes, props.deliveredAt, props.deliveredBy);
    }
    lock() {
        if (this._locked) {
            return;
        }
        this._locked = true;
        this._lockedAt = new Date();
    }
    unlock() {
        if (!this._locked) {
            return;
        }
        this._locked = false;
        this._lockedAt = undefined;
    }
    updateScores(pillarScores, weightedScore) {
        if (this._locked) {
            throw new final_score_locked_exception_1.FinalScoreLockedException('Cannot update scores when final score is locked');
        }
        this._pillarScores = pillarScores;
        this._weightedScore = weightedScore;
    }
    markFeedbackDelivered(deliveredBy, feedbackNotes) {
        this._feedbackDelivered = true;
        this._feedbackDeliveredAt = new Date();
        this._deliveredAt = new Date();
        this._deliveredBy = deliveredBy;
        if (feedbackNotes) {
            this._feedbackNotes = feedbackNotes;
        }
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
    get pillarScores() {
        return this._pillarScores;
    }
    get weightedScore() {
        return this._weightedScore;
    }
    get percentageScore() {
        return this._weightedScore.percentage;
    }
    get bonusTier() {
        return this._weightedScore.bonusTier;
    }
    get peerAverageScores() {
        return this._peerAverageScores;
    }
    get peerFeedbackCount() {
        return this._peerFeedbackCount;
    }
    get isLocked() {
        return this._locked;
    }
    get lockedAt() {
        return this._lockedAt;
    }
    get feedbackDelivered() {
        return this._feedbackDelivered;
    }
    get feedbackDeliveredAt() {
        return this._feedbackDeliveredAt;
    }
    get finalLevel() {
        return this._finalLevel;
    }
    get calculatedAt() {
        return this._calculatedAt;
    }
    get feedbackNotes() {
        return this._feedbackNotes;
    }
    get deliveredAt() {
        return this._deliveredAt;
    }
    get deliveredBy() {
        return this._deliveredBy;
    }
    get employeeId() {
        return this._userId;
    }
    get finalScores() {
        return this._pillarScores;
    }
}
exports.FinalScore = FinalScore;
//# sourceMappingURL=final-score.entity.js.map