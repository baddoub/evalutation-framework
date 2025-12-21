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
exports.PrismaReviewCycleRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
const review_cycle_mapper_1 = require("../mappers/review-cycle.mapper");
let PrismaReviewCycleRepository = class PrismaReviewCycleRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaReviewCycle = await this.prisma.reviewCycle.findUnique({
            where: { id: id.value, deletedAt: null },
        });
        return prismaReviewCycle ? review_cycle_mapper_1.ReviewCycleMapper.toDomain(prismaReviewCycle) : null;
    }
    async findByYear(year) {
        const prismaReviewCycles = await this.prisma.reviewCycle.findMany({
            where: { year, deletedAt: null },
            orderBy: { startDate: 'desc' },
        });
        return prismaReviewCycles.map((cycle) => review_cycle_mapper_1.ReviewCycleMapper.toDomain(cycle));
    }
    async findActive() {
        const prismaReviewCycle = await this.prisma.reviewCycle.findFirst({
            where: { status: 'ACTIVE', deletedAt: null },
        });
        return prismaReviewCycle ? review_cycle_mapper_1.ReviewCycleMapper.toDomain(prismaReviewCycle) : null;
    }
    async save(cycle) {
        const prismaData = review_cycle_mapper_1.ReviewCycleMapper.toPrisma(cycle);
        const saved = await this.prisma.reviewCycle.upsert({
            where: { id: cycle.id.value },
            create: prismaData,
            update: prismaData,
        });
        return review_cycle_mapper_1.ReviewCycleMapper.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.reviewCycle.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PrismaReviewCycleRepository = PrismaReviewCycleRepository;
exports.PrismaReviewCycleRepository = PrismaReviewCycleRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaReviewCycleRepository);
//# sourceMappingURL=prisma-review-cycle.repository.js.map