"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleViolationException = exports.EntityValidationException = exports.InvalidValueObjectException = exports.DomainException = void 0;
const base_exception_1 = require("./base.exception");
class DomainException extends base_exception_1.BaseException {
    constructor(message, code) {
        super(message, code);
    }
}
exports.DomainException = DomainException;
class InvalidValueObjectException extends DomainException {
    constructor(message, code = 'INVALID_VALUE_OBJECT') {
        super(message, code);
    }
}
exports.InvalidValueObjectException = InvalidValueObjectException;
class EntityValidationException extends DomainException {
    constructor(message, code = 'ENTITY_VALIDATION_FAILED') {
        super(message, code);
    }
}
exports.EntityValidationException = EntityValidationException;
class BusinessRuleViolationException extends DomainException {
    constructor(message, code = 'BUSINESS_RULE_VIOLATION') {
        super(message, code);
    }
}
exports.BusinessRuleViolationException = BusinessRuleViolationException;
//# sourceMappingURL=domain.exception.js.map