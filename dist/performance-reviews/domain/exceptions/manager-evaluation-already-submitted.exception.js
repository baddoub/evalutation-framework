"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvaluationAlreadySubmittedException = void 0;
const domain_exception_1 = require("../../../common/exceptions/domain.exception");
class ManagerEvaluationAlreadySubmittedException extends domain_exception_1.DomainException {
    constructor(message = 'Manager evaluation has already been submitted', code = 'MANAGER_EVALUATION_ALREADY_SUBMITTED') {
        super(message, code);
        this.name = 'ManagerEvaluationAlreadySubmittedException';
    }
}
exports.ManagerEvaluationAlreadySubmittedException = ManagerEvaluationAlreadySubmittedException;
//# sourceMappingURL=manager-evaluation-already-submitted.exception.js.map