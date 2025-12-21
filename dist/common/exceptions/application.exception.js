"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationException = exports.ForbiddenException = exports.UnauthorizedException = exports.ResourceNotFoundException = exports.UseCaseException = exports.ApplicationException = void 0;
const base_exception_1 = require("./base.exception");
class ApplicationException extends base_exception_1.BaseException {
    constructor(message, code) {
        super(message, code);
    }
}
exports.ApplicationException = ApplicationException;
class UseCaseException extends ApplicationException {
    constructor(message, code = 'USE_CASE_ERROR') {
        super(message, code);
    }
}
exports.UseCaseException = UseCaseException;
class ResourceNotFoundException extends ApplicationException {
    constructor(message, code = 'RESOURCE_NOT_FOUND') {
        super(message, code);
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
class UnauthorizedException extends ApplicationException {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        super(message, code);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends ApplicationException {
    constructor(message = 'Forbidden', code = 'FORBIDDEN') {
        super(message, code);
    }
}
exports.ForbiddenException = ForbiddenException;
class ValidationException extends ApplicationException {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message, code);
    }
}
exports.ValidationException = ValidationException;
//# sourceMappingURL=application.exception.js.map