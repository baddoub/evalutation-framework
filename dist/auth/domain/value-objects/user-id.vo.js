"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const crypto_1 = require("crypto");
const invalid_user_id_exception_1 = require("../exceptions/invalid-user-id.exception");
class UserId {
    constructor(value) {
        this._value = value;
    }
    static generate() {
        return new UserId((0, crypto_1.randomUUID)());
    }
    static fromString(id) {
        if (!id || typeof id !== 'string') {
            throw new invalid_user_id_exception_1.InvalidUserIdException('Invalid UUID format: ID cannot be empty');
        }
        const trimmedId = id.trim().toLowerCase();
        if (!this.isValid(trimmedId)) {
            throw new invalid_user_id_exception_1.InvalidUserIdException(`Invalid UUID format: ${id}`);
        }
        return new UserId(trimmedId);
    }
    static isValid(id) {
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidV4Regex.test(id);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.UserId = UserId;
//# sourceMappingURL=user-id.vo.js.map