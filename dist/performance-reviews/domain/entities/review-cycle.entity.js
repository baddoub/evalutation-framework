"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCycle = exports.CycleStatus = void 0;
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const invalid_review_cycle_state_exception_1 = require("../exceptions/invalid-review-cycle-state.exception");
class CycleStatus {
    constructor(value) {
        this._value = value;
    }
    static fromString(status) {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'DRAFT':
                return CycleStatus.DRAFT;
            case 'ACTIVE':
                return CycleStatus.ACTIVE;
            case 'CALIBRATION':
                return CycleStatus.CALIBRATION;
            case 'COMPLETED':
                return CycleStatus.COMPLETED;
            default:
                throw new Error(`Invalid cycle status: ${status}`);
        }
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other)
            return false;
        return this._value === other._value;
    }
}
exports.CycleStatus = CycleStatus;
CycleStatus.DRAFT = new CycleStatus('DRAFT');
CycleStatus.ACTIVE = new CycleStatus('ACTIVE');
CycleStatus.CALIBRATION = new CycleStatus('CALIBRATION');
CycleStatus.COMPLETED = new CycleStatus('COMPLETED');
class ReviewCycle {
    constructor(_id, _name, _year, _status, _deadlines, _startDate, _endDate) {
        this._id = _id;
        this._name = _name;
        this._year = _year;
        this._status = _status;
        this._deadlines = _deadlines;
        this._startDate = _startDate;
        this._endDate = _endDate;
    }
    static create(props) {
        return new ReviewCycle(props.id ?? review_cycle_id_vo_1.ReviewCycleId.generate(), props.name, props.year, CycleStatus.DRAFT, props.deadlines, props.startDate ?? new Date());
    }
    start() {
        if (!this._status.equals(CycleStatus.DRAFT)) {
            throw new invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException(`Cannot start cycle from ${this._status.value} status. Must be DRAFT`);
        }
        this._status = CycleStatus.ACTIVE;
    }
    activate() {
        this.start();
    }
    enterCalibration() {
        if (!this._status.equals(CycleStatus.ACTIVE)) {
            throw new invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException(`Cannot enter calibration from ${this._status.value} status. Must be ACTIVE`);
        }
        this._status = CycleStatus.CALIBRATION;
    }
    complete() {
        if (!this._status.equals(CycleStatus.CALIBRATION)) {
            throw new invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException(`Cannot complete cycle from ${this._status.value} status. Must be CALIBRATION`);
        }
        this._status = CycleStatus.COMPLETED;
        this._endDate = new Date();
    }
    hasDeadlinePassed(phase) {
        return this._deadlines.hasPassedDeadline(phase);
    }
    get id() {
        return this._id;
    }
    get name() {
        return this._name;
    }
    get year() {
        return this._year;
    }
    get status() {
        return this._status;
    }
    get deadlines() {
        return this._deadlines;
    }
    get startDate() {
        return this._startDate;
    }
    get endDate() {
        return this._endDate;
    }
    get isActive() {
        return this._status.equals(CycleStatus.ACTIVE);
    }
    get isCompleted() {
        return this._status.equals(CycleStatus.COMPLETED);
    }
}
exports.ReviewCycle = ReviewCycle;
//# sourceMappingURL=review-cycle.entity.js.map