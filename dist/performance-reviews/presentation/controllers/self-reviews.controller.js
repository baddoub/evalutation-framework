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
exports.SelfReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const self_review_dto_1 = require("../dto/self-review.dto");
const get_my_self_review_use_case_1 = require("../../application/use-cases/self-reviews/get-my-self-review.use-case");
const update_self_review_use_case_1 = require("../../application/use-cases/self-reviews/update-self-review.use-case");
const submit_self_review_use_case_1 = require("../../application/use-cases/self-reviews/submit-self-review.use-case");
const review_cycle_id_vo_1 = require("../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const pillar_score_vo_1 = require("../../domain/value-objects/pillar-score.vo");
const narrative_vo_1 = require("../../domain/value-objects/narrative.vo");
let SelfReviewsController = class SelfReviewsController {
    constructor(getMySelfReviewUseCase, updateSelfReviewUseCase, submitSelfReviewUseCase) {
        this.getMySelfReviewUseCase = getMySelfReviewUseCase;
        this.updateSelfReviewUseCase = updateSelfReviewUseCase;
        this.submitSelfReviewUseCase = submitSelfReviewUseCase;
    }
    async getMySelfReview(cycleId, user) {
        const result = await this.getMySelfReviewUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            userId: user_id_vo_1.UserId.fromString(user.userId),
        });
        return {
            id: result.id,
            cycleId: result.cycleId,
            userId: result.userId,
            projectImpact: result.scores.projectImpact,
            direction: result.scores.direction,
            engineeringExcellence: result.scores.engineeringExcellence,
            operationalOwnership: result.scores.operationalOwnership,
            peopleImpact: result.scores.peopleImpact,
            narrative: result.narrative,
            status: result.status,
            submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async updateMySelfReview(cycleId, user, dto) {
        const scores = {};
        if (dto.projectImpact !== undefined)
            scores.projectImpact = pillar_score_vo_1.PillarScore.fromValue(dto.projectImpact);
        if (dto.direction !== undefined)
            scores.direction = pillar_score_vo_1.PillarScore.fromValue(dto.direction);
        if (dto.engineeringExcellence !== undefined)
            scores.engineeringExcellence = pillar_score_vo_1.PillarScore.fromValue(dto.engineeringExcellence);
        if (dto.operationalOwnership !== undefined)
            scores.operationalOwnership = pillar_score_vo_1.PillarScore.fromValue(dto.operationalOwnership);
        if (dto.peopleImpact !== undefined)
            scores.peopleImpact = pillar_score_vo_1.PillarScore.fromValue(dto.peopleImpact);
        const result = await this.updateSelfReviewUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            userId: user_id_vo_1.UserId.fromString(user.userId),
            scores: Object.keys(scores).length > 0 ? scores : undefined,
            narrative: dto.narrative ? narrative_vo_1.Narrative.fromText(dto.narrative) : undefined,
        });
        return {
            id: result.id,
            cycleId: result.cycleId,
            userId: result.userId,
            projectImpact: result.scores.projectImpact,
            direction: result.scores.direction,
            engineeringExcellence: result.scores.engineeringExcellence,
            operationalOwnership: result.scores.operationalOwnership,
            peopleImpact: result.scores.peopleImpact,
            narrative: result.narrative,
            status: result.status,
            submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async submitMySelfReview(cycleId, user) {
        const result = await this.submitSelfReviewUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            userId: user_id_vo_1.UserId.fromString(user.userId),
        });
        return {
            id: result.id,
            status: result.status,
            submittedAt: result.submittedAt.toISOString(),
        };
    }
};
exports.SelfReviewsController = SelfReviewsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my self-review for a cycle' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Self-review retrieved successfully',
        type: self_review_dto_1.SelfReviewResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Self-review not found' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SelfReviewsController.prototype, "getMySelfReview", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update my self-review' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Self-review updated successfully',
        type: self_review_dto_1.SelfReviewResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Self-review not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed or invalid status' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, self_review_dto_1.UpdateSelfReviewRequestDto]),
    __metadata("design:returntype", Promise)
], SelfReviewsController.prototype, "updateMySelfReview", null);
__decorate([
    (0, common_1.Post)('me/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit my self-review' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Self-review submitted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Self-review not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SelfReviewsController.prototype, "submitMySelfReview", null);
exports.SelfReviewsController = SelfReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Self Reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles/:cycleId/self-reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [get_my_self_review_use_case_1.GetMySelfReviewUseCase,
        update_self_review_use_case_1.UpdateSelfReviewUseCase,
        submit_self_review_use_case_1.SubmitSelfReviewUseCase])
], SelfReviewsController);
//# sourceMappingURL=self-reviews.controller.js.map