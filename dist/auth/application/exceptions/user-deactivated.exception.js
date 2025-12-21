"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeactivatedException = void 0;
const application_exception_1 = require("../../../common/exceptions/application.exception");
class UserDeactivatedException extends application_exception_1.ApplicationException {
    constructor(message = 'User account is deactivated') {
        super(message, 'USER_DEACTIVATED');
        this.name = 'UserDeactivatedException';
    }
}
exports.UserDeactivatedException = UserDeactivatedException;
//# sourceMappingURL=user-deactivated.exception.js.map