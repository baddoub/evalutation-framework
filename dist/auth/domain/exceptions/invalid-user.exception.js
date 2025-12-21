"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidUserException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidUserException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_USER') {
        super(message, code);
        this.name = 'InvalidUserException';
    }
}
exports.InvalidUserException = InvalidUserException;
//# sourceMappingURL=invalid-user.exception.js.map