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
exports.ScoreAdjustmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const roles_decorator_1 = require("../decorators/roles.decorator");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const final_score_dto_1 = require("../dto/final-score.dto");
const request_score_adjustment_use_case_1 = require("../../application/use-cases/score-adjustments/request-score-adjustment.use-case");
const review_score_adjustment_use_case_1 = require("../../application/use-cases/score-adjustments/review-score-adjustment.use-case");
const review_cycle_id_vo_1 = require("../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../auth/domain/value-objects/user-id.vo");
let ScoreAdjustmentsController = class ScoreAdjustmentsController {
    constructor(requestScoreAdjustmentUseCase, reviewScoreAdjustmentUseCase) {
        this.requestScoreAdjustmentUseCase = requestScoreAdjustmentUseCase;
        this.reviewScoreAdjustmentUseCase = reviewScoreAdjustmentUseCase;
    }
    async requestScoreAdjustment(cycleId, employeeId, dto, currentUser) {
        const result = await this.requestScoreAdjustmentUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            employeeId: user_id_vo_1.UserId.fromString(employeeId),
            managerId: user_id_vo_1.UserId.fromString(currentUser.userId),
            reason: dto.reason,
            proposedScores: {
                projectImpact: dto.proposedScores.projectImpact,
                direction: dto.proposedScores.direction,
                engineeringExcellence: dto.proposedScores.engineeringExcellence,
                operationalOwnership: dto.proposedScores.operationalOwnership,
                peopleImpact: dto.proposedScores.peopleImpact,
            },
        });
        return {
            id: result.id,
            finalScoreId: employeeId,
            previousScore: 0,
            requestedScore: dto.newWeightedScore,
            reason: result.reason,
            status: result.status,
            requestedBy: currentUser.userId,
            requestedAt: result.requestedAt.toISOString(),
            reviewedAt: null,
            reviewNotes: null,
            reviewedBy: null,
        };
    }
    async reviewScoreAdjustment(requestId, dto, currentUser) {
        const result = await this.reviewScoreAdjustmentUseCase.execute({
            requestId,
            action: dto.action,
            approverId: user_id_vo_1.UserId.fromString(currentUser.userId),
            rejectionReason: dto.rejectionReason,
        });
        return {
            id: result.id,
            finalScoreId: '',
            previousScore: 0,
            requestedScore: 0,
            reason: '',
            status: result.status,
            requestedBy: '',
            requestedAt: '',
            reviewedAt: result.reviewedAt.toISOString(),
            reviewNotes: dto.rejectionReason || 'Approved',
            reviewedBy: result.approvedBy,
        };
    }
};
exports.ScoreAdjustmentsController = ScoreAdjustmentsController;
__decorate([
    (0, common_1.Post)(':cycleId/employees/:employeeId/request'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Request a score adjustment for an employee' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Score adjustment request created successfully',
        type: final_score_dto_1.ScoreAdjustmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Manager only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee or cycle not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request - scores not locked yet' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, final_score_dto_1.ScoreAdjustmentRequestDto, Object]),
    __metadata("design:returntype", Promise)
], ScoreAdjustmentsController.prototype, "requestScoreAdjustment", null);
__decorate([
    (0, common_1.Post)(':requestId/review'),
    (0, roles_decorator_1.Roles)('HR_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a score adjustment request' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Score adjustment request reviewed successfully',
        type: final_score_dto_1.ScoreAdjustmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - HR Admin only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Request already reviewed' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScoreAdjustmentsController.prototype, "reviewScoreAdjustment", null);
exports.ScoreAdjustmentsController = ScoreAdjustmentsController = __decorate([
    (0, swagger_1.ApiTags)('Score Adjustments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/score-adjustments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [request_score_adjustment_use_case_1.RequestScoreAdjustmentUseCase,
        review_score_adjustment_use_case_1.ReviewScoreAdjustmentUseCase])
], ScoreAdjustmentsController);
//# sourceMappingURL=score-adjustments.controller.js.map