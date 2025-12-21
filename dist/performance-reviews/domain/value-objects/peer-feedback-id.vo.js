"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerFeedbackId = void 0;
const crypto_1 = require("crypto");
class PeerFeedbackId {
    constructor(value) {
        this._value = value;
    }
    static generate() {
        return new PeerFeedbackId((0, crypto_1.randomUUID)());
    }
    static fromString(id) {
        return new PeerFeedbackId(id);
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
exports.PeerFeedbackId = PeerFeedbackId;
//# sourceMappingURL=peer-feedback-id.vo.js.map