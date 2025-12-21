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
exports.PrismaPeerFeedbackRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
const peer_feedback_mapper_1 = require("../mappers/peer-feedback.mapper");
let PrismaPeerFeedbackRepository = class PrismaPeerFeedbackRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaFeedback = await this.prisma.peerFeedback.findUnique({
            where: { id: id.value, deletedAt: null },
        });
        return prismaFeedback ? peer_feedback_mapper_1.PeerFeedbackMapper.toDomain(prismaFeedback) : null;
    }
    async findByRevieweeAndCycle(revieweeId, cycleId) {
        const prismaFeedbacks = await this.prisma.peerFeedback.findMany({
            where: {
                revieweeId: revieweeId.value,
                cycleId: cycleId.value,
                deletedAt: null,
            },
            orderBy: { submittedAt: 'desc' },
        });
        return prismaFeedbacks.map((feedback) => peer_feedback_mapper_1.PeerFeedbackMapper.toDomain(feedback));
    }
    async findByEmployeeAndCycle(employeeId, cycleId) {
        return this.findByRevieweeAndCycle(employeeId, cycleId);
    }
    async findByReviewerAndCycle(reviewerId, cycleId) {
        const prismaFeedbacks = await this.prisma.peerFeedback.findMany({
            where: {
                reviewerId: reviewerId.value,
                cycleId: cycleId.value,
                deletedAt: null,
            },
            orderBy: { submittedAt: 'desc' },
        });
        return prismaFeedbacks.map((feedback) => peer_feedback_mapper_1.PeerFeedbackMapper.toDomain(feedback));
    }
    async save(feedback) {
        const prismaData = peer_feedback_mapper_1.PeerFeedbackMapper.toPrisma(feedback);
        const saved = await this.prisma.peerFeedback.upsert({
            where: { id: feedback.id.value },
            create: prismaData,
            update: prismaData,
        });
        return peer_feedback_mapper_1.PeerFeedbackMapper.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.peerFeedback.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PrismaPeerFeedbackRepository = PrismaPeerFeedbackRepository;
exports.PrismaPeerFeedbackRepository = PrismaPeerFeedbackRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPeerFeedbackRepository);
//# sourceMappingURL=prisma-peer-feedback.repository.js.map