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
exports.GetCalibrationDashboardUseCase = void 0;
const common_1 = require("@nestjs/common");
const score_calculation_service_1 = require("../../../domain/services/score-calculation.service");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let GetCalibrationDashboardUseCase = class GetCalibrationDashboardUseCase {
    constructor(cycleRepository, managerEvaluationRepository, userRepository, scoreCalculationService) {
        this.cycleRepository = cycleRepository;
        this.managerEvaluationRepository = managerEvaluationRepository;
        this.userRepository = userRepository;
        this.scoreCalculationService = scoreCalculationService;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        let evaluations = await this.managerEvaluationRepository.findByCycle(input.cycleId);
        if (input.department) {
            const evaluationPromises = evaluations.map(async (evaluation) => {
                const employee = await this.userRepository.findById(evaluation.employeeId);
                return { evaluation, employee };
            });
            const evaluationWithEmployees = await Promise.all(evaluationPromises);
            evaluations = evaluationWithEmployees
                .filter(({ employee }) => employee?.department === input.department)
                .map(({ evaluation }) => evaluation);
        }
        const byBonusTier = { EXCEEDS: 0, MEETS: 0, BELOW: 0 };
        const byDepartment = {};
        const evaluationDetails = await Promise.all(evaluations.map(async (evaluation) => {
            const employee = await this.userRepository.findById(evaluation.employeeId);
            const manager = await this.userRepository.findById(evaluation.managerId);
            const employeeLevel = employee?.level ? engineer_level_vo_1.EngineerLevel.fromString(employee.level) : engineer_level_vo_1.EngineerLevel.MID;
            const weightedScore = this.scoreCalculationService.calculateWeightedScore(evaluation.scores, employeeLevel);
            const bonusTier = weightedScore.bonusTier.value;
            byBonusTier[bonusTier]++;
            const dept = employee?.department || 'Unknown';
            if (!byDepartment[dept]) {
                byDepartment[dept] = { EXCEEDS: 0, MEETS: 0, BELOW: 0 };
            }
            byDepartment[dept][bonusTier]++;
            const scores = evaluation.scores.toObject();
            return {
                employeeId: employee?.id.value || '',
                employeeName: employee?.name || 'Unknown',
                level: employee?.level || 'Unknown',
                department: dept,
                managerId: manager?.id.value || '',
                managerName: manager?.name || 'Unknown',
                scores,
                weightedScore: weightedScore.value,
                percentageScore: weightedScore.percentage,
                bonusTier,
                calibrationStatus: evaluation.isCalibrated ? 'CALIBRATED' : 'PENDING',
            };
        }));
        return {
            summary: {
                totalEvaluations: evaluations.length,
                byBonusTier,
                byDepartment,
            },
            evaluations: evaluationDetails,
        };
    }
};
exports.GetCalibrationDashboardUseCase = GetCalibrationDashboardUseCase;
exports.GetCalibrationDashboardUseCase = GetCalibrationDashboardUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(1, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __param(2, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, score_calculation_service_1.ScoreCalculationService])
], GetCalibrationDashboardUseCase);
//# sourceMappingURL=get-calibration-dashboard.use-case.js.map