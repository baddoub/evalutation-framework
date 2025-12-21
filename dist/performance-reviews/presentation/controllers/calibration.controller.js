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
exports.CalibrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
const calibration_dto_1 = require("../dto/calibration.dto");
const get_calibration_session_use_case_1 = require("../../application/use-cases/calibration/get-calibration-session.use-case");
const record_calibration_note_use_case_1 = require("../../application/use-cases/calibration/record-calibration-note.use-case");
const apply_calibration_adjustment_use_case_1 = require("../../application/use-cases/calibration/apply-calibration-adjustment.use-case");
const lock_calibration_use_case_1 = require("../../application/use-cases/calibration/lock-calibration.use-case");
const calibration_session_id_vo_1 = require("../../domain/value-objects/calibration-session-id.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
let CalibrationController = class CalibrationController {
    constructor(getCalibrationSessionUseCase, recordCalibrationNoteUseCase, applyCalibrationAdjustmentUseCase, lockCalibrationUseCase) {
        this.getCalibrationSessionUseCase = getCalibrationSessionUseCase;
        this.recordCalibrationNoteUseCase = recordCalibrationNoteUseCase;
        this.applyCalibrationAdjustmentUseCase = applyCalibrationAdjustmentUseCase;
        this.lockCalibrationUseCase = lockCalibrationUseCase;
    }
    async getCalibrationSession(sessionId) {
        const result = await this.getCalibrationSessionUseCase.execute(calibration_session_id_vo_1.CalibrationSessionId.fromString(sessionId));
        if (!result) {
            throw new Error('Calibration session not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            department: result.department,
            status: result.status,
            notes: result.notes,
            lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
            lockedBy: result.lockedBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async recordCalibrationNote(sessionId, user, dto) {
        const result = await this.recordCalibrationNoteUseCase.execute({
            sessionId: calibration_session_id_vo_1.CalibrationSessionId.fromString(sessionId),
            notes: dto.notes,
            recordedBy: user_id_vo_1.UserId.fromString(user.userId),
        });
        if (!result) {
            throw new Error('Calibration session not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            department: result.department,
            status: result.status,
            notes: result.notes,
            lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
            lockedBy: result.lockedBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async applyCalibrationAdjustment(sessionId, evaluationId, dto) {
        const result = await this.applyCalibrationAdjustmentUseCase.execute({
            sessionId,
            evaluationId,
            adjustedScores: {
                projectImpact: dto.projectImpact,
                direction: dto.direction,
                engineeringExcellence: dto.engineeringExcellence,
                operationalOwnership: dto.operationalOwnership,
                peopleImpact: dto.peopleImpact,
            },
            justification: dto.reason,
        });
        return {
            id: result.adjustmentId,
            message: 'Calibration adjustment applied successfully',
        };
    }
    async lockCalibration(sessionId, user) {
        const result = await this.lockCalibrationUseCase.execute({
            sessionId: calibration_session_id_vo_1.CalibrationSessionId.fromString(sessionId),
            lockedBy: user_id_vo_1.UserId.fromString(user.userId),
        });
        if (!result) {
            throw new Error('Calibration session not found');
        }
        return {
            id: result.id,
            cycleId: result.cycleId,
            department: result.department,
            status: result.status,
            notes: result.notes,
            lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
            lockedBy: result.lockedBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
};
exports.CalibrationController = CalibrationController;
__decorate([
    (0, common_1.Get)('sessions/:sessionId'),
    (0, roles_decorator_1.Roles)('MANAGER', 'HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get calibration session' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Calibration session retrieved successfully',
        type: calibration_dto_1.CalibrationSessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Calibration session not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CalibrationController.prototype, "getCalibrationSession", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/notes'),
    (0, roles_decorator_1.Roles)('MANAGER', 'HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Record calibration notes' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Calibration notes recorded successfully',
        type: calibration_dto_1.CalibrationSessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Calibration session not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, calibration_dto_1.RecordCalibrationNoteRequestDto]),
    __metadata("design:returntype", Promise)
], CalibrationController.prototype, "recordCalibrationNote", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/adjustments/:evaluationId'),
    (0, roles_decorator_1.Roles)('MANAGER', 'HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply calibration adjustment to manager evaluation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Calibration adjustment applied successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session or evaluation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is locked' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('evaluationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, calibration_dto_1.ApplyCalibrationAdjustmentRequestDto]),
    __metadata("design:returntype", Promise)
], CalibrationController.prototype, "applyCalibrationAdjustment", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/lock'),
    (0, roles_decorator_1.Roles)('HR_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Lock calibration session' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Calibration session locked successfully',
        type: calibration_dto_1.CalibrationSessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Calibration session not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session already locked' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalibrationController.prototype, "lockCalibration", null);
exports.CalibrationController = CalibrationController = __decorate([
    (0, swagger_1.ApiTags)('Calibration'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles/:cycleId/calibration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [get_calibration_session_use_case_1.GetCalibrationSessionUseCase,
        record_calibration_note_use_case_1.RecordCalibrationNoteUseCase,
        apply_calibration_adjustment_use_case_1.ApplyCalibrationAdjustmentUseCase,
        lock_calibration_use_case_1.LockCalibrationUseCase])
], CalibrationController);
//# sourceMappingURL=calibration.controller.js.map