"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreAdjustmentRequestId = void 0;
const uuid_1 = require("uuid");
class ScoreAdjustmentRequestId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim().length === 0) {
            throw new Error('ScoreAdjustmentRequestId cannot be empty');
        }
    }
    get value() {
        return this._value;
    }
    static generate() {
        return new ScoreAdjustmentRequestId((0, uuid_1.v4)());
    }
    static fromString(value) {
        return new ScoreAdjustmentRequestId(value);
    }
    static create(value) {
        return new ScoreAdjustmentRequestId(value || (0, uuid_1.v4)());
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.ScoreAdjustmentRequestId = ScoreAdjustmentRequestId;
//# sourceMappingURL=score-adjustment-request-id.vo.js.map