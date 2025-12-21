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
exports.PrismaFinalScoreRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
const final_score_mapper_1 = require("../mappers/final-score.mapper");
let PrismaFinalScoreRepository = class PrismaFinalScoreRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaScore = await this.prisma.finalScore.findUnique({
            where: { id: id.value, deletedAt: null },
        });
        return prismaScore ? final_score_mapper_1.FinalScoreMapper.toDomain(prismaScore) : null;
    }
    async findByUserAndCycle(userId, cycleId) {
        const prismaScore = await this.prisma.finalScore.findUnique({
            where: {
                cycleId_userId: {
                    cycleId: cycleId.value,
                    userId: userId.value,
                },
                deletedAt: null,
            },
        });
        return prismaScore ? final_score_mapper_1.FinalScoreMapper.toDomain(prismaScore) : null;
    }
    async findByEmployeeAndCycle(employeeId, cycleId) {
        return this.findByUserAndCycle(employeeId, cycleId);
    }
    async findByCycle(cycleId) {
        const prismaScores = await this.prisma.finalScore.findMany({
            where: { cycleId: cycleId.value, deletedAt: null },
            orderBy: { weightedScore: 'desc' },
        });
        return prismaScores.map((score) => final_score_mapper_1.FinalScoreMapper.toDomain(score));
    }
    async findByBonusTier(cycleId, tier) {
        const prismaScores = await this.prisma.finalScore.findMany({
            where: {
                cycleId: cycleId.value,
                bonusTier: tier.value,
                deletedAt: null,
            },
            orderBy: { weightedScore: 'desc' },
        });
        return prismaScores.map((score) => final_score_mapper_1.FinalScoreMapper.toDomain(score));
    }
    async save(score) {
        const prismaData = final_score_mapper_1.FinalScoreMapper.toPrisma(score);
        const saved = await this.prisma.finalScore.upsert({
            where: { id: score.id.value },
            create: prismaData,
            update: prismaData,
        });
        return final_score_mapper_1.FinalScoreMapper.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.finalScore.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PrismaFinalScoreRepository = PrismaFinalScoreRepository;
exports.PrismaFinalScoreRepository = PrismaFinalScoreRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaFinalScoreRepository);
//# sourceMappingURL=prisma-final-score.repository.js.map