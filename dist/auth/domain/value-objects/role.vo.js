"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const invalid_role_exception_1 = require("../exceptions/invalid-role.exception");
class Role {
    constructor(value) {
        this._value = value;
    }
    static create(role) {
        if (!role || typeof role !== 'string') {
            throw new invalid_role_exception_1.InvalidRoleException('Invalid role: Role cannot be empty');
        }
        const trimmedRole = role.trim();
        if (trimmedRole.length === 0) {
            throw new invalid_role_exception_1.InvalidRoleException('Invalid role: Role cannot be empty');
        }
        if (!this.isValid(trimmedRole)) {
            throw new invalid_role_exception_1.InvalidRoleException(`Invalid role: ${role}. Valid roles: ${this.VALID_ROLES.join(', ')}`);
        }
        return new Role(trimmedRole.toLowerCase());
    }
    static admin() {
        return new Role('admin');
    }
    static manager() {
        return new Role('manager');
    }
    static user() {
        return new Role('user');
    }
    static isValid(role) {
        return this.VALID_ROLES.includes(role.toLowerCase());
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    isAdmin() {
        return this._value === 'admin';
    }
    toString() {
        return this._value;
    }
}
exports.Role = Role;
Role.VALID_ROLES = ['admin', 'manager', 'user'];
//# sourceMappingURL=role.vo.js.map