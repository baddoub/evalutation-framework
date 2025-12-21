"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const invalid_user_exception_1 = require("../exceptions/invalid-user.exception");
class User {
    constructor(props) {
        this._id = props.id;
        this._email = props.email;
        this._name = props.name;
        this._keycloakId = props.keycloakId;
        this._roles = props.roles;
        this._isActive = props.isActive;
        this._level = props.level;
        this._department = props.department;
        this._jobTitle = props.jobTitle;
        this._managerId = props.managerId;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
        this._deletedAt = props.deletedAt;
    }
    static create(props) {
        User.validateName(props.name);
        if (!props.keycloakId || props.keycloakId.trim().length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('Keycloak ID is required');
        }
        if (!props.roles || props.roles.length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('User must have at least one role');
        }
        return new User(props);
    }
    updateProfile(name) {
        User.validateName(name);
        this._name = name;
        this.touch();
    }
    assignRole(role) {
        const roleExists = this._roles.some((r) => r.equals(role));
        if (roleExists) {
            return;
        }
        this._roles.push(role);
        this.touch();
    }
    removeRole(role) {
        const roleExists = this._roles.some((r) => r.equals(role));
        if (!roleExists) {
            return;
        }
        if (this._roles.length === 1) {
            throw new invalid_user_exception_1.InvalidUserException('User must have at least one role');
        }
        this._roles = this._roles.filter((r) => !r.equals(role));
        this.touch();
    }
    activate() {
        this._isActive = true;
        this.touch();
    }
    deactivate() {
        this._isActive = false;
        this.touch();
    }
    hasRole(role) {
        return this._roles.some((r) => r.equals(role));
    }
    hasAnyRole(roles) {
        if (!roles || roles.length === 0) {
            return false;
        }
        return roles.some((role) => this.hasRole(role));
    }
    synchronizeFromKeycloak(data) {
        User.validateName(data.name);
        if (!data.roles || data.roles.length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('User must have at least one role');
        }
        this._email = data.email;
        this._name = data.name;
        this._roles = data.roles;
        this.touch();
    }
    touch() {
        this._updatedAt = new Date();
    }
    static validateName(name) {
        if (!name || name.trim().length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('User name cannot be empty');
        }
        if (name.length > 100) {
            throw new invalid_user_exception_1.InvalidUserException('Name too long (max 100 chars)');
        }
    }
    get id() {
        return this._id;
    }
    get email() {
        return this._email;
    }
    get name() {
        return this._name;
    }
    get keycloakId() {
        return this._keycloakId;
    }
    get roles() {
        return [...this._roles];
    }
    get isActive() {
        return this._isActive;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    get deletedAt() {
        return this._deletedAt;
    }
    get level() {
        return this._level;
    }
    get department() {
        return this._department;
    }
    get jobTitle() {
        return this._jobTitle;
    }
    get managerId() {
        return this._managerId;
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map