"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationFailedException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class AuthorizationFailedException extends domain_exception_1.DomainException {
    constructor(message, code = 'AUTHORIZATION_FAILED') {
        super(message, code);
        this.name = 'AuthorizationFailedException';
    }
}
exports.AuthorizationFailedException = AuthorizationFailedException;
//# sourceMappingURL=authorization-failed.exception.js.map