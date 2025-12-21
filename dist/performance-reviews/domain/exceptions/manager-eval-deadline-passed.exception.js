"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvalDeadlinePassedException = void 0;
class ManagerEvalDeadlinePassedException extends Error {
    constructor(message = 'Manager evaluation deadline has passed') {
        super(message);
        this.name = 'ManagerEvalDeadlinePassedException';
    }
}
exports.ManagerEvalDeadlinePassedException = ManagerEvalDeadlinePassedException;
//# sourceMappingURL=manager-eval-deadline-passed.exception.js.map