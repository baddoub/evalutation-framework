"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationFailedException = void 0;
const application_exception_1 = require("../../../common/exceptions/application.exception");
class AuthenticationFailedException extends application_exception_1.ApplicationException {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTHENTICATION_FAILED');
        this.name = 'AuthenticationFailedException';
    }
}
exports.AuthenticationFailedException = AuthenticationFailedException;
//# sourceMappingURL=authentication-failed.exception.js.map