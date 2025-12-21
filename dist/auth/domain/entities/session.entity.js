"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const invalid_user_exception_1 = require("../exceptions/invalid-user.exception");
class Session {
    constructor(props) {
        this._id = props.id;
        this._userId = props.userId;
        this._deviceId = props.deviceId;
        this._userAgent = props.userAgent;
        this._ipAddress = props.ipAddress;
        this._expiresAt = props.expiresAt;
        this._createdAt = props.createdAt;
        this._lastUsed = props.lastUsed;
    }
    static create(props) {
        if (!props.id || props.id.trim().length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('Session ID is required');
        }
        if (props.expiresAt <= props.createdAt) {
            throw new invalid_user_exception_1.InvalidUserException('Session expiration in past');
        }
        if (props.userAgent && props.userAgent.length > 500) {
            throw new invalid_user_exception_1.InvalidUserException('User agent string too long');
        }
        if (props.ipAddress && !Session.isValidIpAddress(props.ipAddress)) {
            throw new invalid_user_exception_1.InvalidUserException('Invalid IP address format');
        }
        return new Session(props);
    }
    isExpired() {
        return this._expiresAt <= new Date();
    }
    updateLastUsed() {
        this._lastUsed = new Date();
    }
    isFromSameDevice(deviceId) {
        if (this._deviceId === null && deviceId === null) {
            return true;
        }
        if (this._deviceId === null || deviceId === null) {
            return false;
        }
        return this._deviceId === deviceId;
    }
    static isValidIpAddress(ip) {
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
    get id() {
        return this._id;
    }
    get userId() {
        return this._userId;
    }
    get deviceId() {
        return this._deviceId;
    }
    get userAgent() {
        return this._userAgent;
    }
    get ipAddress() {
        return this._ipAddress;
    }
    get expiresAt() {
        return this._expiresAt;
    }
    get createdAt() {
        return this._createdAt;
    }
    get lastUsed() {
        return this._lastUsed;
    }
}
exports.Session = Session;
//# sourceMappingURL=session.entity.js.map