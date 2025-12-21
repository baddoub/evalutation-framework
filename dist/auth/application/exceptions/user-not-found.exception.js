"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFoundException = void 0;
const application_exception_1 = require("../../../common/exceptions/application.exception");
class UserNotFoundException extends application_exception_1.ApplicationException {
    constructor(message = 'User not found') {
        super(message, 'USER_NOT_FOUND');
        this.name = 'UserNotFoundException';
    }
}
exports.UserNotFoundException = UserNotFoundException;
//# sourceMappingURL=user-not-found.exception.js.map