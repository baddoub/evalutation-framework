"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserOutput = void 0;
class AuthenticateUserOutput {
    constructor(user, accessToken, refreshToken, expiresIn) {
        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
exports.AuthenticateUserOutput = AuthenticateUserOutput;
//# sourceMappingURL=authenticate-user.output.js.map