"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCycleDeadlinesException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidCycleDeadlinesException extends domain_exception_1.DomainException {
    constructor(message, code = 'INVALID_CYCLE_DEADLINES') {
        super(message, code);
        this.name = 'InvalidCycleDeadlinesException';
    }
}
exports.InvalidCycleDeadlinesException = InvalidCycleDeadlinesException;
//# sourceMappingURL=invalid-cycle-deadlines.exception.js.map