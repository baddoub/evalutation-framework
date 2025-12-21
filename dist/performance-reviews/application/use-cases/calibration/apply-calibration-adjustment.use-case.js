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
exports.ApplyCalibrationAdjustmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const score_calculation_service_1 = require("../../../domain/services/score-calculation.service");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let ApplyCalibrationAdjustmentUseCase = class ApplyCalibrationAdjustmentUseCase {
    constructor(managerEvaluationRepository, calibrationSessionRepository, finalScoreRepository, userRepository, scoreCalculationService) {
        this.managerEvaluationRepository = managerEvaluationRepository;
        this.calibrationSessionRepository = calibrationSessionRepository;
        this.finalScoreRepository = finalScoreRepository;
        this.userRepository = userRepository;
        this.scoreCalculationService = scoreCalculationService;
    }
    async execute(input) {
        const evaluationId = manager_evaluation_entity_1.ManagerEvaluationId.fromString(input.evaluationId);
        const evaluation = await this.managerEvaluationRepository.findById(evaluationId);
        if (!evaluation) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Manager evaluation not found');
        }
        const session = await this.calibrationSessionRepository.findById(input.sessionId);
        if (!session) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Calibration session not found');
        }
        if (!input.justification || input.justification.trim().length < 20) {
            throw new Error('Justification must be at least 20 characters');
        }
        const originalScores = evaluation.scores.toObject();
        const adjustedScores = pillar_scores_vo_1.PillarScores.create(input.adjustedScores);
        evaluation.applyCalibrationAdjustment(adjustedScores, input.justification);
        const employee = await this.userRepository.findById(evaluation.employeeId);
        const employeeLevel = employee?.level ? engineer_level_vo_1.EngineerLevel.fromString(employee.level) : engineer_level_vo_1.EngineerLevel.MID;
        const oldWeightedScore = this.scoreCalculationService.calculateWeightedScore(pillar_scores_vo_1.PillarScores.create(originalScores), employeeLevel);
        const newWeightedScore = this.scoreCalculationService.calculateWeightedScore(adjustedScores, employeeLevel);
        await this.managerEvaluationRepository.save(evaluation);
        const finalScore = await this.finalScoreRepository.findByUserAndCycle(evaluation.employeeId, evaluation.cycleId);
        if (finalScore) {
            await this.finalScoreRepository.save(finalScore);
        }
        const adjustmentId = require('crypto').randomUUID();
        return {
            id: adjustmentId,
            adjustmentId,
            evaluationId: input.evaluationId,
            originalScores,
            adjustedScores: input.adjustedScores,
            oldWeightedScore: oldWeightedScore.value,
            newWeightedScore: newWeightedScore.value,
            oldBonusTier: oldWeightedScore.bonusTier.value,
            newBonusTier: newWeightedScore.bonusTier.value,
            adjustedAt: new Date(),
        };
    }
};
exports.ApplyCalibrationAdjustmentUseCase = ApplyCalibrationAdjustmentUseCase;
exports.ApplyCalibrationAdjustmentUseCase = ApplyCalibrationAdjustmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __param(1, (0, common_1.Inject)('ICalibrationSessionRepository')),
    __param(2, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(3, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, score_calculation_service_1.ScoreCalculationService])
], ApplyCalibrationAdjustmentUseCase);
//# sourceMappingURL=apply-calibration-adjustment.use-case.js.map