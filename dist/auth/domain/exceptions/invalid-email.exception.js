"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEmailException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidEmailException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_EMAIL') {
        super(message, code);
        this.name = 'InvalidEmailException';
    }
}
exports.InvalidEmailException = InvalidEmailException;
//# sourceMappingURL=invalid-email.exception.js.map