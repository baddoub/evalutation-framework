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
exports.PrismaScoreAdjustmentRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
let PrismaScoreAdjustmentRequestRepository = class PrismaScoreAdjustmentRequestRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaRequest = await this.prisma.scoreAdjustmentRequest.findUnique({
            where: { id },
        });
        return prismaRequest ? this.toDomain(prismaRequest) : null;
    }
    async findPending() {
        const prismaRequests = await this.prisma.scoreAdjustmentRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { requestedAt: 'desc' },
        });
        return prismaRequests.map((request) => this.toDomain(request));
    }
    async findByEmployee(employeeId, cycleId) {
        const prismaRequests = await this.prisma.scoreAdjustmentRequest.findMany({
            where: {
                employeeId: employeeId.value,
                cycleId: cycleId.value,
            },
            orderBy: { requestedAt: 'desc' },
        });
        return prismaRequests.map((request) => this.toDomain(request));
    }
    async save(request) {
        const saved = await this.prisma.scoreAdjustmentRequest.upsert({
            where: { id: request.id },
            create: {
                id: request.id,
                cycleId: request.cycleId.value,
                employeeId: request.employeeId.value,
                requesterId: request.requesterId.value,
                approverId: request.approverId?.value ?? null,
                reason: request.reason,
                status: request.status,
                proposedProjectImpact: request.proposedScores.projectImpact.value,
                proposedDirection: request.proposedScores.direction.value,
                proposedEngineeringExcellence: request.proposedScores.engineeringExcellence.value,
                proposedOperationalOwnership: request.proposedScores.operationalOwnership.value,
                proposedPeopleImpact: request.proposedScores.peopleImpact.value,
                requestedAt: request.requestedAt,
                reviewedAt: request.reviewedAt ?? null,
                rejectionReason: request.rejectionReason ?? null,
            },
            update: {
                approverId: request.approverId?.value ?? null,
                status: request.status,
                reviewedAt: request.reviewedAt ?? null,
                rejectionReason: request.rejectionReason ?? null,
            },
        });
        return this.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.scoreAdjustmentRequest.delete({
            where: { id },
        });
    }
    toDomain(prisma) {
        const proposedScores = pillar_scores_vo_1.PillarScores.create({
            projectImpact: prisma.proposedProjectImpact,
            direction: prisma.proposedDirection,
            engineeringExcellence: prisma.proposedEngineeringExcellence,
            operationalOwnership: prisma.proposedOperationalOwnership,
            peopleImpact: prisma.proposedPeopleImpact,
        });
        const request = {
            id: prisma.id,
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            employeeId: user_id_vo_1.UserId.fromString(prisma.employeeId),
            requesterId: user_id_vo_1.UserId.fromString(prisma.requesterId),
            approverId: prisma.approverId ? user_id_vo_1.UserId.fromString(prisma.approverId) : undefined,
            reason: prisma.reason,
            status: prisma.status,
            proposedScores,
            requestedAt: prisma.requestedAt,
            reviewedAt: prisma.reviewedAt ?? undefined,
            rejectionReason: prisma.rejectionReason ?? undefined,
            approve(reviewedBy, _reviewNotes) {
                request.status = 'APPROVED';
                request.approverId = user_id_vo_1.UserId.fromString(reviewedBy);
                request.reviewedAt = new Date();
                request.rejectionReason = undefined;
            },
            reject(reviewedBy, reviewNotes) {
                request.status = 'REJECTED';
                request.approverId = user_id_vo_1.UserId.fromString(reviewedBy);
                request.reviewedAt = new Date();
                request.rejectionReason = reviewNotes;
            },
        };
        return request;
    }
};
exports.PrismaScoreAdjustmentRequestRepository = PrismaScoreAdjustmentRequestRepository;
exports.PrismaScoreAdjustmentRequestRepository = PrismaScoreAdjustmentRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaScoreAdjustmentRequestRepository);
//# sourceMappingURL=prisma-score-adjustment-request.repository.js.map