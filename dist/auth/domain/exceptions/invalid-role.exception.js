"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRoleException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidRoleException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_ROLE') {
        super(message, code);
        this.name = 'InvalidRoleException';
    }
}
exports.InvalidRoleException = InvalidRoleException;
//# sourceMappingURL=invalid-role.exception.js.map