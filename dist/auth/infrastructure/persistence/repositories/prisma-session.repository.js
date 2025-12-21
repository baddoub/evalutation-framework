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
exports.PrismaSessionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const session_mapper_1 = require("../../mappers/session.mapper");
let PrismaSessionRepository = class PrismaSessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaSession = await this.prisma.session.findUnique({
            where: { id },
        });
        return prismaSession ? session_mapper_1.SessionMapper.toDomain(prismaSession) : null;
    }
    async findByUserId(userId) {
        const prismaSessions = await this.prisma.session.findMany({
            where: { userId: userId.value },
            orderBy: { lastUsed: 'desc' },
        });
        return prismaSessions.map((session) => session_mapper_1.SessionMapper.toDomain(session));
    }
    async save(session) {
        const ormData = session_mapper_1.SessionMapper.toOrmData(session);
        const savedSession = await this.prisma.session.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                ...ormData,
            },
            update: ormData,
        });
        return session_mapper_1.SessionMapper.toDomain(savedSession);
    }
    async findActiveByUserId(userId) {
        const prismaSessions = await this.prisma.session.findMany({
            where: {
                userId: userId.value,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: { lastUsed: 'desc' },
        });
        return prismaSessions.map((session) => session_mapper_1.SessionMapper.toDomain(session));
    }
    async delete(id) {
        await this.prisma.session.delete({
            where: { id },
        });
    }
    async deleteAllByUserId(userId) {
        await this.prisma.session.deleteMany({
            where: { userId: userId.value },
        });
    }
    async deleteExpired() {
        const result = await this.prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }
};
exports.PrismaSessionRepository = PrismaSessionRepository;
exports.PrismaSessionRepository = PrismaSessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSessionRepository);
//# sourceMappingURL=prisma-session.repository.js.map