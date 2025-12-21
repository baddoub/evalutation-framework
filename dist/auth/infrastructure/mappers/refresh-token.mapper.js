"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenMapper = void 0;
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
class RefreshTokenMapper {
    static toDomain(prismaToken) {
        const userId = user_id_vo_1.UserId.fromString(prismaToken.userId);
        return refresh_token_entity_1.RefreshToken.create({
            id: prismaToken.id,
            userId,
            tokenHash: prismaToken.tokenHash,
            used: prismaToken.used,
            expiresAt: prismaToken.expiresAt,
            createdAt: prismaToken.createdAt,
            revokedAt: prismaToken.revokedAt ?? undefined,
        });
    }
    static toOrm(domainToken) {
        return {
            id: domainToken.id,
            userId: domainToken.userId.value,
            tokenHash: domainToken.tokenHash,
            used: domainToken.used,
            expiresAt: domainToken.expiresAt,
            createdAt: domainToken.createdAt,
            revokedAt: domainToken.revokedAt ?? null,
        };
    }
    static toOrmData(domainToken) {
        return {
            userId: domainToken.userId.value,
            tokenHash: domainToken.tokenHash,
            used: domainToken.used,
            expiresAt: domainToken.expiresAt,
            createdAt: domainToken.createdAt,
            revokedAt: domainToken.revokedAt ?? null,
        };
    }
}
exports.RefreshTokenMapper = RefreshTokenMapper;
//# sourceMappingURL=refresh-token.mapper.js.map