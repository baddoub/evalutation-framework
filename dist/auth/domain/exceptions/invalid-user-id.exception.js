"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidUserIdException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidUserIdException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_USER_ID') {
        super(message, code);
        this.name = 'InvalidUserIdException';
    }
}
exports.InvalidUserIdException = InvalidUserIdException;
//# sourceMappingURL=invalid-user-id.exception.js.map