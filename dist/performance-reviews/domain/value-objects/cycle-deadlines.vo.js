"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CycleDeadlines = void 0;
const invalid_cycle_deadlines_exception_1 = require("../exceptions/invalid-cycle-deadlines.exception");
class CycleDeadlines {
    constructor(_selfReview, _peerFeedback, _managerEvaluation, _calibration, _feedbackDelivery) {
        this._selfReview = _selfReview;
        this._peerFeedback = _peerFeedback;
        this._managerEvaluation = _managerEvaluation;
        this._calibration = _calibration;
        this._feedbackDelivery = _feedbackDelivery;
        this.validateDeadlineOrder();
    }
    static create(deadlines) {
        return new CycleDeadlines(deadlines.selfReview, deadlines.peerFeedback, deadlines.managerEvaluation, deadlines.calibration, deadlines.feedbackDelivery);
    }
    validateDeadlineOrder() {
        const deadlines = [
            { name: 'Self Review', date: this._selfReview },
            { name: 'Peer Feedback', date: this._peerFeedback },
            { name: 'Manager Evaluation', date: this._managerEvaluation },
            { name: 'Calibration', date: this._calibration },
            { name: 'Feedback Delivery', date: this._feedbackDelivery },
        ];
        for (let i = 1; i < deadlines.length; i++) {
            const currentDeadline = deadlines[i];
            const previousDeadline = deadlines[i - 1];
            if (currentDeadline.date <= previousDeadline.date) {
                throw new invalid_cycle_deadlines_exception_1.InvalidCycleDeadlinesException(`${currentDeadline.name} deadline must be after ${previousDeadline.name} deadline`);
            }
        }
    }
    get selfReview() {
        return this._selfReview;
    }
    get peerFeedback() {
        return this._peerFeedback;
    }
    get managerEvaluation() {
        return this._managerEvaluation;
    }
    get calibration() {
        return this._calibration;
    }
    get feedbackDelivery() {
        return this._feedbackDelivery;
    }
    hasPassedDeadline(phase) {
        const now = new Date();
        const deadline = this[phase];
        return now > deadline;
    }
    toObject() {
        return {
            selfReview: this._selfReview,
            peerFeedback: this._peerFeedback,
            managerEvaluation: this._managerEvaluation,
            calibration: this._calibration,
            feedbackDelivery: this._feedbackDelivery,
        };
    }
}
exports.CycleDeadlines = CycleDeadlines;
//# sourceMappingURL=cycle-deadlines.vo.js.map