"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStateTransitionException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class InvalidStateTransitionException extends domain_exception_1.BusinessRuleViolationException {
    constructor(message, code = 'INVALID_STATE_TRANSITION') {
        super(message, code);
        this.name = 'InvalidStateTransitionException';
    }
}
exports.InvalidStateTransitionException = InvalidStateTransitionException;
//# sourceMappingURL=invalid-state-transition.exception.js.map