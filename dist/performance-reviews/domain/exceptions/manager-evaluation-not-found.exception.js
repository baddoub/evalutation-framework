"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvaluationNotFoundException = void 0;
class ManagerEvaluationNotFoundException extends Error {
    constructor(message = 'Manager evaluation not found') {
        super(message);
        this.name = 'ManagerEvaluationNotFoundException';
    }
}
exports.ManagerEvaluationNotFoundException = ManagerEvaluationNotFoundException;
//# sourceMappingURL=manager-evaluation-not-found.exception.js.map