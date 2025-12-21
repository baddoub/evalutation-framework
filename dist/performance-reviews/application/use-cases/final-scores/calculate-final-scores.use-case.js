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
exports.CalculateFinalScoresUseCase = void 0;
const common_1 = require("@nestjs/common");
const final_score_calculation_service_1 = require("../../../domain/services/final-score-calculation.service");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
let CalculateFinalScoresUseCase = class CalculateFinalScoresUseCase {
    constructor(finalScoreRepository, managerEvaluationRepository, calculationService) {
        this.finalScoreRepository = finalScoreRepository;
        this.managerEvaluationRepository = managerEvaluationRepository;
        this.calculationService = calculationService;
    }
    async execute(cycleId) {
        const evaluations = await this.managerEvaluationRepository.findByCycle(review_cycle_id_vo_1.ReviewCycleId.create(cycleId));
        for (const evaluation of evaluations) {
            const finalScore = this.calculationService.calculateFinalScore(evaluation);
            await this.finalScoreRepository.save(finalScore);
        }
    }
};
exports.CalculateFinalScoresUseCase = CalculateFinalScoresUseCase;
exports.CalculateFinalScoresUseCase = CalculateFinalScoresUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(1, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __metadata("design:paramtypes", [Object, Object, final_score_calculation_service_1.FinalScoreCalculationService])
], CalculateFinalScoresUseCase);
//# sourceMappingURL=calculate-final-scores.use-case.js.map