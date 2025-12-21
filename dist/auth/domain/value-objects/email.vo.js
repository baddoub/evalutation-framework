"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const invalid_email_exception_1 = require("../exceptions/invalid-email.exception");
class Email {
    constructor(value) {
        this._value = value;
    }
    static create(email) {
        if (!email || typeof email !== 'string') {
            throw new invalid_email_exception_1.InvalidEmailException('Invalid email format: Email cannot be empty');
        }
        const trimmedEmail = email.trim();
        if (trimmedEmail.length === 0) {
            throw new invalid_email_exception_1.InvalidEmailException('Invalid email format: Email cannot be empty');
        }
        if (!this.isValid(trimmedEmail)) {
            throw new invalid_email_exception_1.InvalidEmailException(`Invalid email format: ${email}`);
        }
        return new Email(trimmedEmail.toLowerCase());
    }
    static isValid(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
exports.Email = Email;
//# sourceMappingURL=email.vo.js.map