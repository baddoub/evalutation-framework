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
exports.PrismaCalibrationSessionRepository = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
let PrismaCalibrationSessionRepository = class PrismaCalibrationSessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaSession = await this.prisma.calibrationSession.findUnique({
            where: { id },
        });
        return prismaSession ? this.toDomain(prismaSession) : null;
    }
    async findByCycle(cycleId) {
        const prismaSessions = await this.prisma.calibrationSession.findMany({
            where: { cycleId: cycleId.value },
            orderBy: { scheduledAt: 'desc' },
        });
        return prismaSessions.map((session) => this.toDomain(session));
    }
    async findByDepartment(cycleId, department) {
        const prismaSessions = await this.prisma.calibrationSession.findMany({
            where: {
                cycleId: cycleId.value,
                department,
            },
            orderBy: { scheduledAt: 'desc' },
        });
        return prismaSessions.map((session) => this.toDomain(session));
    }
    async save(session) {
        const saved = await this.prisma.calibrationSession.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                cycleId: session.cycleId.value,
                name: session.name,
                department: session.department ?? null,
                facilitatorId: session.facilitatorId.value,
                participantIds: session.participantIds,
                scheduledAt: session.scheduledAt,
                completedAt: session.completedAt ?? null,
                status: session.status,
                notes: session.notes ?? null,
            },
            update: {
                name: session.name,
                department: session.department ?? null,
                participantIds: session.participantIds,
                scheduledAt: session.scheduledAt,
                completedAt: session.completedAt ?? null,
                status: session.status,
                notes: session.notes ?? null,
            },
        });
        return this.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.calibrationSession.delete({
            where: { id },
        });
    }
    toDomain(prisma) {
        return {
            id: prisma.id,
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            name: prisma.name,
            department: prisma.department ?? undefined,
            facilitatorId: user_id_vo_1.UserId.fromString(prisma.facilitatorId),
            participantIds: prisma.participantIds,
            scheduledAt: prisma.scheduledAt,
            completedAt: prisma.completedAt ?? undefined,
            status: prisma.status,
            notes: prisma.notes ?? undefined,
        };
    }
};
exports.PrismaCalibrationSessionRepository = PrismaCalibrationSessionRepository;
exports.PrismaCalibrationSessionRepository = PrismaCalibrationSessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCalibrationSessionRepository);
//# sourceMappingURL=prisma-calibration-session.repository.js.map