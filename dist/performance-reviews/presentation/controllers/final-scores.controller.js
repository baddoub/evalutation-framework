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
exports.FinalScoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
const final_score_dto_1 = require("../dto/final-score.dto");
const get_final_score_use_case_1 = require("../../application/use-cases/final-scores/get-final-score.use-case");
const deliver_feedback_use_case_1 = require("../../application/use-cases/final-scores/deliver-feedback.use-case");
const request_score_adjustment_use_case_1 = require("../../application/use-cases/score-adjustments/request-score-adjustment.use-case");
const approve_score_adjustment_use_case_1 = require("../../application/use-cases/score-adjustments/approve-score-adjustment.use-case");
const review_cycle_id_vo_1 = require("../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
let FinalScoresController = class FinalScoresController {
    constructor(getFinalScoreUseCase, deliverFeedbackUseCase, requestScoreAdjustmentUseCase, approveScoreAdjustmentUseCase) {
        this.getFinalScoreUseCase = getFinalScoreUseCase;
        this.deliverFeedbackUseCase = deliverFeedbackUseCase;
        this.requestScoreAdjustmentUseCase = requestScoreAdjustmentUseCase;
        this.approveScoreAdjustmentUseCase = approveScoreAdjustmentUseCase;
    }
    async getFinalScore(cycleId, employeeId) {
        const result = await this.getFinalScoreUseCase.execute(employeeId, cycleId);
        if (!result) {
            throw new Error('Final score not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            employeeId: result.employeeId,
            weightedScore: result.weightedScore,
            percentageScore: result.percentageScore,
            bonusTier: result.bonusTier,
            feedbackNotes: result.feedbackNotes,
            deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
            deliveredBy: result.deliveredBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async getMyFinalScore(cycleId, user) {
        const result = await this.getFinalScoreUseCase.execute(user.userId, cycleId);
        if (!result) {
            throw new Error('Final score not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            employeeId: result.employeeId,
            weightedScore: result.weightedScore,
            percentageScore: result.percentageScore,
            bonusTier: result.bonusTier,
            feedbackNotes: result.feedbackNotes,
            deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
            deliveredBy: result.deliveredBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async deliverFeedback(cycleId, employeeId, user, dto) {
        const finalScore = await this.getFinalScoreUseCase.execute(employeeId, cycleId);
        if (!finalScore) {
            throw new Error('Final score not found');
        }
        const result = await this.deliverFeedbackUseCase.execute({
            finalScoreId: finalScore.id,
            feedbackNotes: dto.feedbackNotes,
            deliveredBy: user.userId,
        });
        return {
            id: result.id,
            cycleId: result.cycleId,
            employeeId: result.employeeId,
            weightedScore: result.weightedScore,
            percentageScore: result.percentageScore,
            bonusTier: result.bonusTier,
            feedbackNotes: result.feedbackNotes,
            deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
            deliveredBy: result.deliveredBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async requestScoreAdjustment(cycleId, employeeId, user, dto) {
        const result = await this.requestScoreAdjustmentUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            employeeId: user_id_vo_1.UserId.fromString(employeeId),
            managerId: user_id_vo_1.UserId.fromString(user.userId),
            proposedScores: dto.proposedScores,
            reason: dto.reason,
        });
        return {
            id: result.id,
            finalScoreId: '',
            previousScore: 0,
            requestedScore: 0,
            reason: result.reason,
            status: result.status,
            requestedBy: user.userId,
            reviewedBy: null,
            reviewNotes: null,
            requestedAt: result.requestedAt.toISOString(),
            reviewedAt: null,
        };
    }
    async approveScoreAdjustment(adjustmentId, user, body) {
        const result = await this.approveScoreAdjustmentUseCase.execute({
            requestId: adjustmentId,
            reviewedBy: user.userId,
            approved: body.approved,
            reviewNotes: body.reviewNotes,
        });
        return {
            id: result.id,
            finalScoreId: '',
            previousScore: 0,
            requestedScore: 0,
            reason: '',
            status: result.status,
            requestedBy: '',
            reviewedBy: result.reviewedBy || null,
            reviewNotes: body.reviewNotes || null,
            requestedAt: new Date().toISOString(),
            reviewedAt: result.reviewedAt.toISOString(),
        };
    }
};
exports.FinalScoresController = FinalScoresController;
__decorate([
    (0, common_1.Get)('employees/:employeeId'),
    (0, roles_decorator_1.Roles)('MANAGER', 'HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get final score for an employee' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Final score retrieved successfully',
        type: final_score_dto_1.FinalScoreResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Final score not found' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinalScoresController.prototype, "getFinalScore", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my final score' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Final score retrieved successfully',
        type: final_score_dto_1.FinalScoreResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Final score not found' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinalScoresController.prototype, "getMyFinalScore", null);
__decorate([
    (0, common_1.Post)('employees/:employeeId/deliver'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Deliver feedback to employee' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Feedback delivered successfully',
        type: final_score_dto_1.FinalScoreResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Final score not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed or already delivered' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, final_score_dto_1.DeliverFeedbackRequestDto]),
    __metadata("design:returntype", Promise)
], FinalScoresController.prototype, "deliverFeedback", null);
__decorate([
    (0, common_1.Post)('employees/:employeeId/adjustments'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Request score adjustment' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Score adjustment requested successfully',
        type: final_score_dto_1.ScoreAdjustmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Final score not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Calibration not locked' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, final_score_dto_1.ScoreAdjustmentRequestDto]),
    __metadata("design:returntype", Promise)
], FinalScoresController.prototype, "requestScoreAdjustment", null);
__decorate([
    (0, common_1.Post)('adjustments/:adjustmentId/approve'),
    (0, roles_decorator_1.Roles)('HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve score adjustment request' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Score adjustment approved successfully',
        type: final_score_dto_1.ScoreAdjustmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Adjustment request not found' }),
    __param(0, (0, common_1.Param)('adjustmentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FinalScoresController.prototype, "approveScoreAdjustment", null);
exports.FinalScoresController = FinalScoresController = __decorate([
    (0, swagger_1.ApiTags)('Final Scores'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles/:cycleId/final-scores'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [get_final_score_use_case_1.GetFinalScoreUseCase,
        deliver_feedback_use_case_1.DeliverFeedbackUseCase,
        request_score_adjustment_use_case_1.RequestScoreAdjustmentUseCase,
        approve_score_adjustment_use_case_1.ApproveScoreAdjustmentUseCase])
], FinalScoresController);
//# sourceMappingURL=final-scores.controller.js.map