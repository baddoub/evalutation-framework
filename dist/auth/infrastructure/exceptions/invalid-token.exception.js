"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTokenException = void 0;
class InvalidTokenException extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'InvalidTokenException';
    }
}
exports.InvalidTokenException = InvalidTokenException;
//# sourceMappingURL=invalid-token.exception.js.map