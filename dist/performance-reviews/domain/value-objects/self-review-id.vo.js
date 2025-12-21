"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReviewId = void 0;
const crypto_1 = require("crypto");
class SelfReviewId {
    constructor(value) {
        this._value = value;
    }
    static generate() {
        return new SelfReviewId((0, crypto_1.randomUUID)());
    }
    static fromString(id) {
        return new SelfReviewId(id);
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
exports.SelfReviewId = SelfReviewId;
//# sourceMappingURL=self-review-id.vo.js.map