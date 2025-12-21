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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const user_mapper_1 = require("../../mappers/user.mapper");
let PrismaUserRepository = class PrismaUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaUser = await this.prisma.user.findFirst({
            where: {
                id: id.value,
                deletedAt: null,
            },
        });
        return prismaUser ? user_mapper_1.UserMapper.toDomain(prismaUser) : null;
    }
    async findByEmail(email) {
        const prismaUser = await this.prisma.user.findFirst({
            where: {
                email: email.value,
                deletedAt: null,
            },
        });
        return prismaUser ? user_mapper_1.UserMapper.toDomain(prismaUser) : null;
    }
    async findByKeycloakId(keycloakId) {
        const prismaUser = await this.prisma.user.findFirst({
            where: {
                keycloakId,
                deletedAt: null,
            },
        });
        return prismaUser ? user_mapper_1.UserMapper.toDomain(prismaUser) : null;
    }
    async save(user) {
        const ormData = user_mapper_1.UserMapper.toOrmData(user);
        const savedUser = await this.prisma.user.upsert({
            where: { id: user.id.value },
            create: {
                id: user.id.value,
                ...ormData,
            },
            update: ormData,
        });
        return user_mapper_1.UserMapper.toDomain(savedUser);
    }
    async delete(id) {
        await this.prisma.user.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
    async existsByEmail(email) {
        const count = await this.prisma.user.count({
            where: {
                email: email.value,
                deletedAt: null,
            },
        });
        return count > 0;
    }
    async findByRole(role) {
        const prismaUsers = await this.prisma.user.findMany({
            where: {
                roles: {
                    has: role.value,
                },
                deletedAt: null,
            },
        });
        return prismaUsers.map((prismaUser) => user_mapper_1.UserMapper.toDomain(prismaUser));
    }
    async findByManagerId(managerId) {
        const prismaUsers = await this.prisma.user.findMany({
            where: {
                managerId,
                deletedAt: null,
            },
        });
        return prismaUsers.map((prismaUser) => user_mapper_1.UserMapper.toDomain(prismaUser));
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map