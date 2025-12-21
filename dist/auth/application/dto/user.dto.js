"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDto = void 0;
class UserDto {
    constructor(id, email, name, keycloakId, roles, isActive, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.keycloakId = keycloakId;
        this.roles = roles;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static fromDomain(user) {
        return new UserDto(user.id.value, user.email.value, user.name, user.keycloakId, user.roles.map((role) => role.value), user.isActive, user.createdAt, user.updatedAt);
    }
}
exports.UserDto = UserDto;
//# sourceMappingURL=user.dto.js.map