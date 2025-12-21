"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScoreId = void 0;
const crypto_1 = require("crypto");
class FinalScoreId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim().length === 0) {
            throw new Error('FinalScoreId cannot be empty');
        }
    }
    get value() {
        return this._value;
    }
    static generate() {
        return new FinalScoreId((0, crypto_1.randomUUID)());
    }
    static fromString(value) {
        return new FinalScoreId(value);
    }
    static create(value) {
        return new FinalScoreId(value || (0, crypto_1.randomUUID)());
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.FinalScoreId = FinalScoreId;
//# sourceMappingURL=final-score-id.vo.js.map