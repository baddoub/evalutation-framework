"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerFeedback = void 0;
const peer_feedback_id_vo_1 = require("../value-objects/peer-feedback-id.vo");
class PeerFeedback {
    constructor(_id, _cycleId, _revieweeId, _reviewerId, _scores, _strengths, _growthAreas, _generalComments, _submittedAt) {
        this._id = _id;
        this._cycleId = _cycleId;
        this._revieweeId = _revieweeId;
        this._reviewerId = _reviewerId;
        this._scores = _scores;
        this._strengths = _strengths;
        this._growthAreas = _growthAreas;
        this._generalComments = _generalComments;
        this._submittedAt = _submittedAt;
    }
    static create(props) {
        return new PeerFeedback(props.id ?? peer_feedback_id_vo_1.PeerFeedbackId.generate(), props.cycleId, props.revieweeId, props.reviewerId, props.scores, props.strengths, props.growthAreas, props.generalComments, new Date());
    }
    get id() {
        return this._id;
    }
    get cycleId() {
        return this._cycleId;
    }
    get revieweeId() {
        return this._revieweeId;
    }
    get reviewerId() {
        return this._reviewerId;
    }
    get scores() {
        return this._scores;
    }
    get strengths() {
        return this._strengths;
    }
    get growthAreas() {
        return this._growthAreas;
    }
    get generalComments() {
        return this._generalComments;
    }
    get submittedAt() {
        return this._submittedAt;
    }
    get isAnonymized() {
        return true;
    }
}
exports.PeerFeedback = PeerFeedback;
//# sourceMappingURL=peer-feedback.entity.js.map