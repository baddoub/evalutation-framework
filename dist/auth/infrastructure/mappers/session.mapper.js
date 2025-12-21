"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMapper = void 0;
const session_entity_1 = require("../../domain/entities/session.entity");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
class SessionMapper {
    static toDomain(prismaSession) {
        const userId = user_id_vo_1.UserId.fromString(prismaSession.userId);
        return session_entity_1.Session.create({
            id: prismaSession.id,
            userId,
            deviceId: prismaSession.deviceId,
            userAgent: prismaSession.userAgent,
            ipAddress: prismaSession.ipAddress,
            expiresAt: prismaSession.expiresAt,
            createdAt: prismaSession.createdAt,
            lastUsed: prismaSession.lastUsed,
        });
    }
    static toOrm(domainSession) {
        return {
            id: domainSession.id,
            userId: domainSession.userId.value,
            deviceId: domainSession.deviceId,
            userAgent: domainSession.userAgent,
            ipAddress: domainSession.ipAddress,
            expiresAt: domainSession.expiresAt,
            createdAt: domainSession.createdAt,
            lastUsed: domainSession.lastUsed,
        };
    }
    static toOrmData(domainSession) {
        return {
            userId: domainSession.userId.value,
            deviceId: domainSession.deviceId,
            userAgent: domainSession.userAgent,
            ipAddress: domainSession.ipAddress,
            expiresAt: domainSession.expiresAt,
            createdAt: domainSession.createdAt,
            lastUsed: domainSession.lastUsed,
        };
    }
}
exports.SessionMapper = SessionMapper;
//# sourceMappingURL=session.mapper.js.map