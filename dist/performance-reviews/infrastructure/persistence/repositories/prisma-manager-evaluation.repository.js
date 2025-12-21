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
exports.PrismaManagerEvaluationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
const manager_evaluation_mapper_1 = require("../mappers/manager-evaluation.mapper");
let PrismaManagerEvaluationRepository = class PrismaManagerEvaluationRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaEvaluation = await this.prisma.managerEvaluation.findUnique({
            where: { id: id.value, deletedAt: null },
        });
        return prismaEvaluation ? manager_evaluation_mapper_1.ManagerEvaluationMapper.toDomain(prismaEvaluation) : null;
    }
    async findByEmployeeAndCycle(employeeId, cycleId) {
        const prismaEvaluation = await this.prisma.managerEvaluation.findUnique({
            where: {
                cycleId_employeeId: {
                    cycleId: cycleId.value,
                    employeeId: employeeId.value,
                },
                deletedAt: null,
            },
        });
        return prismaEvaluation ? manager_evaluation_mapper_1.ManagerEvaluationMapper.toDomain(prismaEvaluation) : null;
    }
    async findByManagerAndCycle(managerId, cycleId) {
        const prismaEvaluations = await this.prisma.managerEvaluation.findMany({
            where: {
                managerId: managerId.value,
                cycleId: cycleId.value,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
        return prismaEvaluations.map((evaluation) => manager_evaluation_mapper_1.ManagerEvaluationMapper.toDomain(evaluation));
    }
    async findByCycle(cycleId) {
        const prismaEvaluations = await this.prisma.managerEvaluation.findMany({
            where: { cycleId: cycleId.value, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        return prismaEvaluations.map((evaluation) => manager_evaluation_mapper_1.ManagerEvaluationMapper.toDomain(evaluation));
    }
    async save(evaluation) {
        const prismaData = manager_evaluation_mapper_1.ManagerEvaluationMapper.toPrisma(evaluation);
        const saved = await this.prisma.managerEvaluation.upsert({
            where: { id: evaluation.id.value },
            create: prismaData,
            update: prismaData,
        });
        return manager_evaluation_mapper_1.ManagerEvaluationMapper.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.managerEvaluation.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PrismaManagerEvaluationRepository = PrismaManagerEvaluationRepository;
exports.PrismaManagerEvaluationRepository = PrismaManagerEvaluationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaManagerEvaluationRepository);
//# sourceMappingURL=prisma-manager-evaluation.repository.js.map