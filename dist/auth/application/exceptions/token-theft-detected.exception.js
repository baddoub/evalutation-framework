"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTheftDetectedException = void 0;
const application_exception_1 = require("../../../common/exceptions/application.exception");
class TokenTheftDetectedException extends application_exception_1.ApplicationException {
    constructor(message = 'Token reuse detected - all sessions revoked') {
        super(message, 'TOKEN_THEFT_DETECTED');
        this.name = 'TokenTheftDetectedException';
    }
}
exports.TokenTheftDetectedException = TokenTheftDetectedException;
//# sourceMappingURL=token-theft-detected.exception.js.map