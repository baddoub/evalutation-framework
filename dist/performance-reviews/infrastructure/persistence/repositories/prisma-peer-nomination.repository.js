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
exports.PrismaPeerNominationRepository = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
let PrismaPeerNominationRepository = class PrismaPeerNominationRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaNomination = await this.prisma.peerNomination.findUnique({
            where: { id },
        });
        return prismaNomination ? this.toDomain(prismaNomination) : null;
    }
    async findByNominatorAndCycle(nominatorId, cycleId) {
        const prismaNominations = await this.prisma.peerNomination.findMany({
            where: {
                nominatorId: nominatorId.value,
                cycleId: cycleId.value,
            },
            orderBy: { nominatedAt: 'desc' },
        });
        return prismaNominations.map((nom) => this.toDomain(nom));
    }
    async findByNomineeAndCycle(nomineeId, cycleId) {
        const prismaNominations = await this.prisma.peerNomination.findMany({
            where: {
                nomineeId: nomineeId.value,
                cycleId: cycleId.value,
            },
            orderBy: { nominatedAt: 'desc' },
        });
        return prismaNominations.map((nom) => this.toDomain(nom));
    }
    async save(nomination) {
        const saved = await this.prisma.peerNomination.upsert({
            where: { id: nomination.id },
            create: {
                id: nomination.id,
                cycleId: nomination.cycleId.value,
                nominatorId: nomination.nominatorId.value,
                nomineeId: nomination.nomineeId.value,
                status: nomination.status,
                declineReason: nomination.declineReason ?? null,
                nominatedAt: nomination.nominatedAt,
                respondedAt: nomination.respondedAt ?? null,
            },
            update: {
                status: nomination.status,
                declineReason: nomination.declineReason ?? null,
                respondedAt: nomination.respondedAt ?? null,
            },
        });
        return this.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.peerNomination.delete({
            where: { id },
        });
    }
    toDomain(prisma) {
        return {
            id: prisma.id,
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            nominatorId: user_id_vo_1.UserId.fromString(prisma.nominatorId),
            nomineeId: user_id_vo_1.UserId.fromString(prisma.nomineeId),
            status: prisma.status,
            declineReason: prisma.declineReason ?? undefined,
            nominatedAt: prisma.nominatedAt,
            respondedAt: prisma.respondedAt ?? undefined,
        };
    }
};
exports.PrismaPeerNominationRepository = PrismaPeerNominationRepository;
exports.PrismaPeerNominationRepository = PrismaPeerNominationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPeerNominationRepository);
//# sourceMappingURL=prisma-peer-nomination.repository.js.map