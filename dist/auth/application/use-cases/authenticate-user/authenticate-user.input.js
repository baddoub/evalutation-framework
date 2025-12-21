"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserInput = void 0;
class AuthenticateUserInput {
    constructor(authorizationCode, codeVerifier, deviceId, userAgent, ipAddress) {
        this.authorizationCode = authorizationCode;
        this.codeVerifier = codeVerifier;
        this.deviceId = deviceId;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
    }
}
exports.AuthenticateUserInput = AuthenticateUserInput;
//# sourceMappingURL=authenticate-user.input.js.map