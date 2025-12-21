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
exports.ManagerEvaluationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
const manager_evaluation_dto_1 = require("../dto/manager-evaluation.dto");
const get_manager_evaluation_use_case_1 = require("../../application/use-cases/manager-evaluations/get-manager-evaluation.use-case");
const update_manager_evaluation_use_case_1 = require("../../application/use-cases/manager-evaluations/update-manager-evaluation.use-case");
const submit_manager_evaluation_use_case_1 = require("../../application/use-cases/manager-evaluations/submit-manager-evaluation.use-case");
const review_cycle_id_vo_1 = require("../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const pillar_score_vo_1 = require("../../domain/value-objects/pillar-score.vo");
let ManagerEvaluationsController = class ManagerEvaluationsController {
    constructor(getManagerEvaluationUseCase, updateManagerEvaluationUseCase, submitManagerEvaluationUseCase) {
        this.getManagerEvaluationUseCase = getManagerEvaluationUseCase;
        this.updateManagerEvaluationUseCase = updateManagerEvaluationUseCase;
        this.submitManagerEvaluationUseCase = submitManagerEvaluationUseCase;
    }
    async getManagerEvaluation(cycleId, employeeId, user) {
        const result = await this.getManagerEvaluationUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            employeeId: user_id_vo_1.UserId.fromString(employeeId),
            managerId: user_id_vo_1.UserId.fromString(user.userId),
        });
        if (!result) {
            throw new common_1.NotFoundException('Manager evaluation not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            employeeId: result.employeeId,
            managerId: result.managerId,
            projectImpact: result.scores.projectImpact,
            direction: result.scores.direction,
            engineeringExcellence: result.scores.engineeringExcellence,
            operationalOwnership: result.scores.operationalOwnership,
            peopleImpact: result.scores.peopleImpact,
            managerComments: result.managerComments,
            status: result.status,
            submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async updateManagerEvaluation(cycleId, employeeId, user, dto) {
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
        const result = await this.updateManagerEvaluationUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            employeeId: user_id_vo_1.UserId.fromString(employeeId),
            managerId: user_id_vo_1.UserId.fromString(user.userId),
            scores: Object.keys(scores).length > 0 ? scores : undefined,
            managerComments: dto.managerComments,
        });
        if (!result) {
            throw new common_1.NotFoundException('Manager evaluation not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            employeeId: result.employeeId,
            managerId: result.managerId,
            projectImpact: result.scores.projectImpact,
            direction: result.scores.direction,
            engineeringExcellence: result.scores.engineeringExcellence,
            operationalOwnership: result.scores.operationalOwnership,
            peopleImpact: result.scores.peopleImpact,
            managerComments: result.managerComments,
            status: result.status,
            submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async submitManagerEvaluation(cycleId, employeeId, user, dto) {
        const result = await this.submitManagerEvaluationUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            employeeId: user_id_vo_1.UserId.fromString(employeeId),
            managerId: user_id_vo_1.UserId.fromString(user.userId),
            scores: {
                projectImpact: dto.projectImpact,
                direction: dto.direction,
                engineeringExcellence: dto.engineeringExcellence,
                operationalOwnership: dto.operationalOwnership,
                peopleImpact: dto.peopleImpact,
            },
            narrative: dto.narrative,
            strengths: dto.strengths,
            growthAreas: dto.growthAreas,
            developmentPlan: dto.developmentPlan,
        });
        if (!result) {
            throw new common_1.NotFoundException('Manager evaluation not found');
        }
        return {
            id: result.id,
            status: result.status,
            submittedAt: result.submittedAt.toISOString(),
        };
    }
};
exports.ManagerEvaluationsController = ManagerEvaluationsController;
__decorate([
    (0, common_1.Get)('employees/:employeeId'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get manager evaluation for an employee' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manager evaluation retrieved successfully',
        type: manager_evaluation_dto_1.ManagerEvaluationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Manager evaluation not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Manager only' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ManagerEvaluationsController.prototype, "getManagerEvaluation", null);
__decorate([
    (0, common_1.Patch)('employees/:employeeId'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Update manager evaluation for an employee' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manager evaluation updated successfully',
        type: manager_evaluation_dto_1.ManagerEvaluationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Manager evaluation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed or invalid status' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, manager_evaluation_dto_1.UpdateManagerEvaluationRequestDto]),
    __metadata("design:returntype", Promise)
], ManagerEvaluationsController.prototype, "updateManagerEvaluation", null);
__decorate([
    (0, common_1.Post)('employees/:employeeId/submit'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit manager evaluation for an employee' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manager evaluation submitted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Manager evaluation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, manager_evaluation_dto_1.SubmitManagerEvaluationRequestDto]),
    __metadata("design:returntype", Promise)
], ManagerEvaluationsController.prototype, "submitManagerEvaluation", null);
exports.ManagerEvaluationsController = ManagerEvaluationsController = __decorate([
    (0, swagger_1.ApiTags)('Manager Evaluations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles/:cycleId/manager-evaluations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [get_manager_evaluation_use_case_1.GetManagerEvaluationUseCase,
        update_manager_evaluation_use_case_1.UpdateManagerEvaluationUseCase,
        submit_manager_evaluation_use_case_1.SubmitManagerEvaluationUseCase])
], ManagerEvaluationsController);
//# sourceMappingURL=manager-evaluations.controller.js.map