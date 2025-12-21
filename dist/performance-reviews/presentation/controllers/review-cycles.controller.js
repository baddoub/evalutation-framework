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
exports.ReviewCyclesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const roles_decorator_1 = require("../decorators/roles.decorator");
const review_cycle_dto_1 = require("../dto/review-cycle.dto");
const create_review_cycle_use_case_1 = require("../../application/use-cases/review-cycles/create-review-cycle.use-case");
const activate_review_cycle_use_case_1 = require("../../application/use-cases/review-cycles/activate-review-cycle.use-case");
const get_review_cycle_use_case_1 = require("../../application/use-cases/review-cycles/get-review-cycle.use-case");
let ReviewCyclesController = class ReviewCyclesController {
    constructor(createReviewCycleUseCase, activateReviewCycleUseCase, getReviewCycleUseCase) {
        this.createReviewCycleUseCase = createReviewCycleUseCase;
        this.activateReviewCycleUseCase = activateReviewCycleUseCase;
        this.getReviewCycleUseCase = getReviewCycleUseCase;
    }
    async createReviewCycle(dto) {
        const result = await this.createReviewCycleUseCase.execute({
            name: dto.name,
            year: dto.year,
            deadlines: {
                selfReview: new Date(dto.selfReviewDeadline),
                peerFeedback: new Date(dto.peerFeedbackDeadline),
                managerEvaluation: new Date(dto.managerEvalDeadline),
                calibration: new Date(dto.calibrationDeadline),
                feedbackDelivery: new Date(dto.feedbackDeliveryDeadline),
            },
        });
        return {
            id: result.id,
            name: result.name,
            year: result.year,
            status: result.status,
            selfReviewDeadline: result.deadlines.selfReview.toISOString(),
            peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
            managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
            calibrationDeadline: result.deadlines.calibration.toISOString(),
            feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.createdAt.toISOString(),
        };
    }
    async getReviewCycle(cycleId) {
        const result = await this.getReviewCycleUseCase.execute(cycleId);
        return {
            id: result.id,
            name: result.name,
            year: result.year,
            status: result.status,
            selfReviewDeadline: result.deadlines.selfReview.toISOString(),
            peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
            managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
            calibrationDeadline: result.deadlines.calibration.toISOString(),
            feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
            createdAt: result.startDate.toISOString(),
            updatedAt: result.startDate.toISOString(),
        };
    }
    async activateReviewCycle(cycleId) {
        const activateResult = await this.activateReviewCycleUseCase.execute(cycleId);
        const result = await this.getReviewCycleUseCase.execute(cycleId);
        return {
            id: result.id,
            name: result.name,
            year: result.year,
            status: activateResult.status,
            selfReviewDeadline: result.deadlines.selfReview.toISOString(),
            peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
            managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
            calibrationDeadline: result.deadlines.calibration.toISOString(),
            feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
            createdAt: result.startDate.toISOString(),
            updatedAt: activateResult.activatedAt.toISOString(),
        };
    }
};
exports.ReviewCyclesController = ReviewCyclesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new review cycle' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Review cycle created successfully',
        type: review_cycle_dto_1.ReviewCycleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - HR Admin only' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_cycle_dto_1.CreateReviewCycleRequestDto]),
    __metadata("design:returntype", Promise)
], ReviewCyclesController.prototype, "createReviewCycle", null);
__decorate([
    (0, common_1.Get)(':cycleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get review cycle by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Review cycle retrieved successfully',
        type: review_cycle_dto_1.ReviewCycleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Review cycle not found' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewCyclesController.prototype, "getReviewCycle", null);
__decorate([
    (0, common_1.Post)(':cycleId/activate'),
    (0, roles_decorator_1.Roles)('HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a review cycle' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Review cycle activated successfully',
        type: review_cycle_dto_1.ReviewCycleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Review cycle not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid cycle status for activation' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewCyclesController.prototype, "activateReviewCycle", null);
exports.ReviewCyclesController = ReviewCyclesController = __decorate([
    (0, swagger_1.ApiTags)('Review Cycles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [create_review_cycle_use_case_1.CreateReviewCycleUseCase,
        activate_review_cycle_use_case_1.ActivateReviewCycleUseCase,
        get_review_cycle_use_case_1.GetReviewCycleUseCase])
], ReviewCyclesController);
//# sourceMappingURL=review-cycles.controller.js.map