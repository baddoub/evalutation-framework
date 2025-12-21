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
exports.StartReviewCycleUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let StartReviewCycleUseCase = class StartReviewCycleUseCase {
    constructor(reviewCycleRepository) {
        this.reviewCycleRepository = reviewCycleRepository;
    }
    async execute(input) {
        const cycleId = review_cycle_id_vo_1.ReviewCycleId.fromString(input.cycleId);
        const cycle = await this.reviewCycleRepository.findById(cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId} not found`);
        }
        const activeCycle = await this.reviewCycleRepository.findActive();
        if (activeCycle && !activeCycle.id.equals(cycleId)) {
            throw new Error('Another review cycle is already active. Please complete it first.');
        }
        cycle.start();
        const updatedCycle = await this.reviewCycleRepository.save(cycle);
        return {
            id: updatedCycle.id.value,
            status: updatedCycle.status.value,
            startedAt: updatedCycle.startDate,
        };
    }
};
exports.StartReviewCycleUseCase = StartReviewCycleUseCase;
exports.StartReviewCycleUseCase = StartReviewCycleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object])
], StartReviewCycleUseCase);
//# sourceMappingURL=start-review-cycle.use-case.js.map