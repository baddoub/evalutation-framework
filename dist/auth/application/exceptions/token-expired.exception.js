"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExpiredException = void 0;
const application_exception_1 = require("../../../common/exceptions/application.exception");
class TokenExpiredException extends application_exception_1.ApplicationException {
    constructor(message = 'Token has expired') {
        super(message, 'TOKEN_EXPIRED');
        this.name = 'TokenExpiredException';
    }
}
exports.TokenExpiredException = TokenExpiredException;
//# sourceMappingURL=token-expired.exception.js.map