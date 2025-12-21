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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReviewCycleUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
let CreateReviewCycleUseCase = class CreateReviewCycleUseCase {
    constructor(reviewCycleRepository) {
        this.reviewCycleRepository = reviewCycleRepository;
    }
    async execute(input) {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: input.deadlines.selfReview,
            peerFeedback: input.deadlines.peerFeedback,
            managerEvaluation: input.deadlines.managerEvaluation,
            calibration: input.deadlines.calibration,
            feedbackDelivery: input.deadlines.feedbackDelivery,
        });
        const cycle = review_cycle_entity_1.ReviewCycle.create({
            name: input.name,
            year: input.year,
            deadlines,
            startDate: input.startDate,
        });
        const savedCycle = await this.reviewCycleRepository.save(cycle);
        return {
            id: savedCycle.id.value,
            name: savedCycle.name,
            year: savedCycle.year,
            status: savedCycle.status.value,
            deadlines: savedCycle.deadlines.toObject(),
            startDate: savedCycle.startDate,
            createdAt: new Date(),
        };
    }
};
exports.CreateReviewCycleUseCase = CreateReviewCycleUseCase;
exports.CreateReviewCycleUseCase = CreateReviewCycleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object])
], CreateReviewCycleUseCase);
//# sourceMappingURL=create-review-cycle.use-case.js.map