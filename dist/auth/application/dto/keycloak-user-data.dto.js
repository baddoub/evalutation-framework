"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakUserDataDto = void 0;
class KeycloakUserDataDto {
    constructor(keycloakId, email, name, emailVerified, preferredUsername) {
        this.keycloakId = keycloakId;
        this.email = email;
        this.name = name;
        this.emailVerified = emailVerified;
        this.preferredUsername = preferredUsername;
    }
    static fromKeycloakUserInfo(userInfo) {
        return new KeycloakUserDataDto(userInfo.sub, userInfo.email, userInfo.name, userInfo.email_verified, userInfo.preferred_username);
    }
}
exports.KeycloakUserDataDto = KeycloakUserDataDto;
//# sourceMappingURL=keycloak-user-data.dto.js.map