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
exports.GetMySelfReviewUseCase = void 0;
const common_1 = require("@nestjs/common");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let GetMySelfReviewUseCase = class GetMySelfReviewUseCase {
    constructor(selfReviewRepository, cycleRepository) {
        this.selfReviewRepository = selfReviewRepository;
        this.cycleRepository = cycleRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        let review = await this.selfReviewRepository.findByUserAndCycle(input.userId, input.cycleId);
        if (!review) {
            review = self_review_entity_1.SelfReview.create({
                cycleId: input.cycleId,
                userId: input.userId,
                scores: pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                }),
                narrative: narrative_vo_1.Narrative.fromText(''),
            });
            review = await this.selfReviewRepository.save(review);
        }
        const scores = review.scores.toObject();
        return {
            id: review.id.value,
            cycleId: review.cycleId.value,
            userId: review.userId.value,
            status: review.status.value,
            scores: {
                projectImpact: scores.projectImpact,
                direction: scores.direction,
                engineeringExcellence: scores.engineeringExcellence,
                operationalOwnership: scores.operationalOwnership,
                peopleImpact: scores.peopleImpact,
            },
            narrative: review.narrative.text,
            wordCount: review.narrative.wordCount,
            submittedAt: review.submittedAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
};
exports.GetMySelfReviewUseCase = GetMySelfReviewUseCase;
exports.GetMySelfReviewUseCase = GetMySelfReviewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ISelfReviewRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetMySelfReviewUseCase);
//# sourceMappingURL=get-my-self-review.use-case.js.map