"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedAccessException = void 0;
class UnauthorizedAccessException extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedAccessException';
    }
}
exports.UnauthorizedAccessException = UnauthorizedAccessException;
//# sourceMappingURL=unauthorized-access.exception.js.map