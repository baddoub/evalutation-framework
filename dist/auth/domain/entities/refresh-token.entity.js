"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const invalid_user_exception_1 = require("../exceptions/invalid-user.exception");
class RefreshToken {
    constructor(props) {
        this._id = props.id;
        this._userId = props.userId;
        this._tokenHash = props.tokenHash;
        this._used = props.used;
        this._expiresAt = props.expiresAt;
        this._createdAt = props.createdAt;
        this._revokedAt = props.revokedAt;
    }
    static create(props) {
        if (!props.id || props.id.trim().length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('Refresh token ID is required');
        }
        if (!props.tokenHash || props.tokenHash.trim().length === 0) {
            throw new invalid_user_exception_1.InvalidUserException('Token hash is required');
        }
        if (props.expiresAt <= props.createdAt) {
            throw new invalid_user_exception_1.InvalidUserException('Expiration must be in future');
        }
        return new RefreshToken(props);
    }
    markAsUsed() {
        this._used = true;
    }
    revoke() {
        if (!this._revokedAt) {
            this._revokedAt = new Date();
        }
    }
    isExpired() {
        return this._expiresAt <= new Date();
    }
    isValid() {
        return !this._used && !this._revokedAt && !this.isExpired();
    }
    get id() {
        return this._id;
    }
    get userId() {
        return this._userId;
    }
    get tokenHash() {
        return this._tokenHash;
    }
    get used() {
        return this._used;
    }
    get expiresAt() {
        return this._expiresAt;
    }
    get createdAt() {
        return this._createdAt;
    }
    get revokedAt() {
        return this._revokedAt;
    }
}
exports.RefreshToken = RefreshToken;
//# sourceMappingURL=refresh-token.entity.js.map