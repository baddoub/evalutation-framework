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
exports.PrismaSelfReviewRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../auth/infrastructure/persistence/prisma/prisma.service");
const self_review_mapper_1 = require("../mappers/self-review.mapper");
let PrismaSelfReviewRepository = class PrismaSelfReviewRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const prismaSelfReview = await this.prisma.selfReview.findUnique({
            where: { id: id.value, deletedAt: null },
        });
        return prismaSelfReview ? self_review_mapper_1.SelfReviewMapper.toDomain(prismaSelfReview) : null;
    }
    async findByUserAndCycle(userId, cycleId) {
        const prismaSelfReview = await this.prisma.selfReview.findUnique({
            where: {
                cycleId_userId: {
                    cycleId: cycleId.value,
                    userId: userId.value,
                },
                deletedAt: null,
            },
        });
        return prismaSelfReview ? self_review_mapper_1.SelfReviewMapper.toDomain(prismaSelfReview) : null;
    }
    async findByCycle(cycleId) {
        const prismaSelfReviews = await this.prisma.selfReview.findMany({
            where: { cycleId: cycleId.value, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        return prismaSelfReviews.map((review) => self_review_mapper_1.SelfReviewMapper.toDomain(review));
    }
    async save(review) {
        const prismaData = self_review_mapper_1.SelfReviewMapper.toPrisma(review);
        const saved = await this.prisma.selfReview.upsert({
            where: { id: review.id.value },
            create: prismaData,
            update: prismaData,
        });
        return self_review_mapper_1.SelfReviewMapper.toDomain(saved);
    }
    async delete(id) {
        await this.prisma.selfReview.update({
            where: { id: id.value },
            data: { deletedAt: new Date() },
        });
    }
};
exports.PrismaSelfReviewRepository = PrismaSelfReviewRepository;
exports.PrismaSelfReviewRepository = PrismaSelfReviewRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSelfReviewRepository);
//# sourceMappingURL=prisma-self-review.repository.js.map