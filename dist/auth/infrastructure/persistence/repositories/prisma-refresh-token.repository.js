"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRefreshTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const refresh_token_mapper_1 = require("../../mappers/refresh-token.mapper");
let PrismaRefreshTokenRepository = class PrismaRefreshTokenRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaToken = await this.prisma.refreshToken.findUnique({
            where: { id },
        });
        return prismaToken ? refresh_token_mapper_1.RefreshTokenMapper.toDomain(prismaToken) : null;
    }
    async findByTokenHash(hash) {
        const prismaToken = await this.prisma.refreshToken.findUnique({
            where: { tokenHash: hash },
        });
        return prismaToken ? refresh_token_mapper_1.RefreshTokenMapper.toDomain(prismaToken) : null;
    }
    async findByUserId(userId) {
        const prismaTokens = await this.prisma.refreshToken.findMany({
            where: { userId: userId.value },
            orderBy: { createdAt: 'desc' },
        });
        return prismaTokens.map((token) => refresh_token_mapper_1.RefreshTokenMapper.toDomain(token));
    }
    async save(token) {
        const ormData = refresh_token_mapper_1.RefreshTokenMapper.toOrmData(token);
        const savedToken = await this.prisma.refreshToken.upsert({
            where: { id: token.id },
            create: {
                id: token.id,
                ...ormData,
            },
            update: ormData,
        });
        return refresh_token_mapper_1.RefreshTokenMapper.toDomain(savedToken);
    }
    async delete(id) {
        await this.prisma.refreshToken.delete({
            where: { id },
        });
    }
    async deleteAllByUserId(userId) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId: userId.value },
        });
    }
    async deleteExpiredAndRevoked() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
            },
        });
        return result.count;
    }
};
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository;
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRefreshTokenRepository);
//# sourceMappingURL=prisma-refresh-token.repository.js.map