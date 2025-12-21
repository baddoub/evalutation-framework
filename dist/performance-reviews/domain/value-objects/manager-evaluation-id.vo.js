"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvaluationId = void 0;
const crypto_1 = require("crypto");
class ManagerEvaluationId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim().length === 0) {
            throw new Error('ManagerEvaluationId cannot be empty');
        }
    }
    get value() {
        return this._value;
    }
    static create(value) {
        return new ManagerEvaluationId(value || (0, crypto_1.randomUUID)());
    }
    static fromString(value) {
        return new ManagerEvaluationId(value);
    }
    static generate() {
        return new ManagerEvaluationId((0, crypto_1.randomUUID)());
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.ManagerEvaluationId = ManagerEvaluationId;
//# sourceMappingURL=manager-evaluation-id.vo.js.map