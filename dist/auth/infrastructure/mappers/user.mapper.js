"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../../domain/entities/user.entity");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const role_vo_1 = require("../../domain/value-objects/role.vo");
class UserMapper {
    static toDomain(prismaUser) {
        const userId = user_id_vo_1.UserId.fromString(prismaUser.id);
        const email = email_vo_1.Email.create(prismaUser.email);
        const roles = prismaUser.roles.map((roleString) => role_vo_1.Role.create(roleString));
        return user_entity_1.User.create({
            id: userId,
            email,
            name: prismaUser.name,
            keycloakId: prismaUser.keycloakId,
            roles,
            isActive: prismaUser.isActive,
            level: prismaUser.level,
            department: prismaUser.department,
            jobTitle: prismaUser.jobTitle,
            managerId: prismaUser.managerId,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
            deletedAt: prismaUser.deletedAt ?? undefined,
        });
    }
    static toOrm(domainUser) {
        return {
            id: domainUser.id.value,
            email: domainUser.email.value,
            name: domainUser.name,
            keycloakId: domainUser.keycloakId,
            roles: domainUser.roles.map((role) => role.value),
            isActive: domainUser.isActive,
            level: domainUser.level ?? null,
            department: domainUser.department ?? null,
            jobTitle: domainUser.jobTitle ?? null,
            managerId: domainUser.managerId ?? null,
            createdAt: domainUser.createdAt,
            updatedAt: domainUser.updatedAt,
            deletedAt: domainUser.deletedAt ?? null,
        };
    }
    static toOrmData(domainUser) {
        return {
            email: domainUser.email.value,
            name: domainUser.name,
            keycloakId: domainUser.keycloakId,
            roles: domainUser.roles.map((role) => role.value),
            isActive: domainUser.isActive,
            level: domainUser.level ?? null,
            department: domainUser.department ?? null,
            jobTitle: domainUser.jobTitle ?? null,
            managerId: domainUser.managerId ?? null,
            createdAt: domainUser.createdAt,
            updatedAt: domainUser.updatedAt,
            deletedAt: domainUser.deletedAt ?? null,
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map