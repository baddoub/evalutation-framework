"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEngineerLevelException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidEngineerLevelException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_ENGINEER_LEVEL') {
        super(message, code);
        this.name = 'InvalidEngineerLevelException';
    }
}
exports.InvalidEngineerLevelException = InvalidEngineerLevelException;
//# sourceMappingURL=invalid-engineer-level.exception.js.map