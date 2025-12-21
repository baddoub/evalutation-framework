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
exports.SubmitSelfReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let SubmitSelfReviewUseCase = class SubmitSelfReviewUseCase {
    constructor(selfReviewRepository, cycleRepository) {
        this.selfReviewRepository = selfReviewRepository;
        this.cycleRepository = cycleRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        if (cycle.hasDeadlinePassed('selfReview')) {
            throw new Error('Self-review deadline has passed');
        }
        const review = await this.selfReviewRepository.findByUserAndCycle(input.userId, input.cycleId);
        if (!review) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Self-review not found for this user and cycle');
        }
        if (review.narrative.text.trim() === '') {
            throw new Error('Cannot submit incomplete self-review. Narrative is required.');
        }
        review.submit();
        const submittedReview = await this.selfReviewRepository.save(review);
        return {
            id: submittedReview.id.value,
            status: submittedReview.status.value,
            submittedAt: submittedReview.submittedAt,
        };
    }
};
exports.SubmitSelfReviewUseCase = SubmitSelfReviewUseCase;
exports.SubmitSelfReviewUseCase = SubmitSelfReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ISelfReviewRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], SubmitSelfReviewUseCase);
//# sourceMappingURL=submit-self-review.use-case.js.map