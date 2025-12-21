"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationSessionId = void 0;
const uuid_1 = require("uuid");
class CalibrationSessionId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim().length === 0) {
            throw new Error('CalibrationSessionId cannot be empty');
        }
    }
    get value() {
        return this._value;
    }
    static create(value) {
        return new CalibrationSessionId(value || (0, uuid_1.v4)());
    }
    static fromString(value) {
        return new CalibrationSessionId(value);
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.CalibrationSessionId = CalibrationSessionId;
//# sourceMappingURL=calibration-session-id.vo.js.map