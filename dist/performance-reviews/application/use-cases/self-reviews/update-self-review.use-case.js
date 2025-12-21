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
exports.UpdateSelfReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let UpdateSelfReviewUseCase = class UpdateSelfReviewUseCase {
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
        if (input.scores) {
            const scores = pillar_scores_vo_1.PillarScores.create(input.scores);
            review.updateScores(scores);
        }
        if (input.narrative) {
            review.updateNarrative(input.narrative);
        }
        const updatedReview = await this.selfReviewRepository.save(review);
        const updatedScores = updatedReview.scores.toObject();
        return {
            id: updatedReview.id.value,
            userId: updatedReview.userId.value,
            cycleId: updatedReview.cycleId.value,
            status: updatedReview.status.value,
            scores: {
                projectImpact: updatedScores.projectImpact,
                direction: updatedScores.direction,
                engineeringExcellence: updatedScores.engineeringExcellence,
                operationalOwnership: updatedScores.operationalOwnership,
                peopleImpact: updatedScores.peopleImpact,
            },
            narrative: updatedReview.narrative.text,
            wordCount: updatedReview.narrative.wordCount,
            submittedAt: updatedReview.submittedAt,
            updatedAt: new Date(),
        };
    }
};
exports.UpdateSelfReviewUseCase = UpdateSelfReviewUseCase;
exports.UpdateSelfReviewUseCase = UpdateSelfReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ISelfReviewRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], UpdateSelfReviewUseCase);
//# sourceMappingURL=update-self-review.use-case.js.map