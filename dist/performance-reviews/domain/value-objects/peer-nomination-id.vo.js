"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerNominationId = void 0;
const uuid_1 = require("uuid");
class PeerNominationId {
    constructor(_value) {
        this._value = _value;
        if (!_value || _value.trim().length === 0) {
            throw new Error('PeerNominationId cannot be empty');
        }
    }
    get value() {
        return this._value;
    }
    static generate() {
        return new PeerNominationId((0, uuid_1.v4)());
    }
    static fromString(value) {
        return new PeerNominationId(value);
    }
    static create(value) {
        return new PeerNominationId(value || (0, uuid_1.v4)());
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.PeerNominationId = PeerNominationId;
//# sourceMappingURL=peer-nomination-id.vo.js.map