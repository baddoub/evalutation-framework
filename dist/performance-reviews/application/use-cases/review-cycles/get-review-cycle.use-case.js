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
exports.GetReviewCycleUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
let GetReviewCycleUseCase = class GetReviewCycleUseCase {
    constructor(reviewCycleRepository) {
        this.reviewCycleRepository = reviewCycleRepository;
    }
    async execute(cycleId) {
        const cycle = await this.reviewCycleRepository.findById(review_cycle_id_vo_1.ReviewCycleId.create(cycleId));
        if (!cycle) {
            throw new Error('Review cycle not found');
        }
        return {
            id: cycle.id.value,
            name: cycle.name,
            year: cycle.year,
            status: cycle.status.value,
            deadlines: cycle.deadlines.toObject(),
            startDate: cycle.startDate,
            endDate: cycle.endDate,
        };
    }
};
exports.GetReviewCycleUseCase = GetReviewCycleUseCase;
exports.GetReviewCycleUseCase = GetReviewCycleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object])
], GetReviewCycleUseCase);
//# sourceMappingURL=get-review-cycle.use-case.js.map