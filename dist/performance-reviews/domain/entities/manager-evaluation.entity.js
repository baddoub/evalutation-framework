"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvaluation = exports.ManagerEvaluationId = void 0;
const review_status_vo_1 = require("../value-objects/review-status.vo");
const manager_evaluation_already_submitted_exception_1 = require("../exceptions/manager-evaluation-already-submitted.exception");
const manager_evaluation_id_vo_1 = require("../value-objects/manager-evaluation-id.vo");
var manager_evaluation_id_vo_2 = require("../value-objects/manager-evaluation-id.vo");
Object.defineProperty(exports, "ManagerEvaluationId", { enumerable: true, get: function () { return manager_evaluation_id_vo_2.ManagerEvaluationId; } });
class ManagerEvaluation {
    constructor(_id, _cycleId, _employeeId, _managerId, _scores, _narrative, _strengths, _growthAreas, _developmentPlan, _status, _employeeLevel, _proposedLevel, _performanceNarrative, _submittedAt, _calibratedAt, _createdAt = new Date(), _updatedAt = new Date()) {
        this._id = _id;
        this._cycleId = _cycleId;
        this._employeeId = _employeeId;
        this._managerId = _managerId;
        this._scores = _scores;
        this._narrative = _narrative;
        this._strengths = _strengths;
        this._growthAreas = _growthAreas;
        this._developmentPlan = _developmentPlan;
        this._status = _status;
        this._employeeLevel = _employeeLevel;
        this._proposedLevel = _proposedLevel;
        this._performanceNarrative = _performanceNarrative;
        this._submittedAt = _submittedAt;
        this._calibratedAt = _calibratedAt;
        this._createdAt = _createdAt;
        this._updatedAt = _updatedAt;
    }
    static create(props) {
        return new ManagerEvaluation(props.id ?? manager_evaluation_id_vo_1.ManagerEvaluationId.generate(), props.cycleId, props.employeeId, props.managerId, props.scores, props.narrative, props.strengths, props.growthAreas, props.developmentPlan, review_status_vo_1.ReviewStatus.DRAFT, props.employeeLevel, props.proposedLevel, props.performanceNarrative, undefined, undefined, props.createdAt ?? new Date(), props.updatedAt ?? new Date());
    }
    updateScores(scores) {
        if (this.isSubmitted) {
            throw new manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException('Cannot update scores after submission');
        }
        this._scores = scores;
        this._updatedAt = new Date();
    }
    submit() {
        if (this.isSubmitted) {
            throw new manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException();
        }
        this._status = review_status_vo_1.ReviewStatus.SUBMITTED;
        this._submittedAt = new Date();
        this._updatedAt = new Date();
    }
    calibrate() {
        if (!this.isSubmitted) {
            throw new Error('Cannot calibrate evaluation that has not been submitted');
        }
        this._status = review_status_vo_1.ReviewStatus.CALIBRATED;
        this._calibratedAt = new Date();
        this._updatedAt = new Date();
    }
    applyCalibrationAdjustment(newScores, _justification) {
        if (!this.isSubmitted) {
            throw new Error('Cannot apply calibration to unsubmitted evaluation');
        }
        this._scores = newScores;
        this._updatedAt = new Date();
        this.calibrate();
    }
    updatePerformanceNarrative(narrative) {
        if (this.isSubmitted) {
            throw new manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException('Cannot update performance narrative after submission');
        }
        this._performanceNarrative = narrative.text;
        this._updatedAt = new Date();
    }
    updateGrowthAreas(growthAreas) {
        if (this.isSubmitted) {
            throw new manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException('Cannot update growth areas after submission');
        }
        this._growthAreas = growthAreas.text;
        this._updatedAt = new Date();
    }
    updateProposedLevel(level) {
        if (this.isSubmitted) {
            throw new manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException('Cannot update proposed level after submission');
        }
        this._proposedLevel = level;
        this._updatedAt = new Date();
    }
    get id() {
        return this._id;
    }
    get cycleId() {
        return this._cycleId;
    }
    get employeeId() {
        return this._employeeId;
    }
    get managerId() {
        return this._managerId;
    }
    get scores() {
        return this._scores;
    }
    get narrative() {
        return this._narrative;
    }
    get strengths() {
        return this._strengths;
    }
    get growthAreas() {
        return this._growthAreas;
    }
    get developmentPlan() {
        return this._developmentPlan;
    }
    get status() {
        return this._status;
    }
    get submittedAt() {
        return this._submittedAt;
    }
    get calibratedAt() {
        return this._calibratedAt;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    get isSubmitted() {
        return this._status.equals(review_status_vo_1.ReviewStatus.SUBMITTED) || this._status.equals(review_status_vo_1.ReviewStatus.CALIBRATED);
    }
    get isCalibrated() {
        return this._status.equals(review_status_vo_1.ReviewStatus.CALIBRATED);
    }
    get employeeLevel() {
        return this._employeeLevel;
    }
    get proposedLevel() {
        return this._proposedLevel;
    }
    get performanceNarrative() {
        return this._performanceNarrative;
    }
}
exports.ManagerEvaluation = ManagerEvaluation;
//# sourceMappingURL=manager-evaluation.entity.js.map