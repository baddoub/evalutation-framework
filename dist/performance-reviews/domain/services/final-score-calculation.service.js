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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScoreCalculationService = void 0;
const common_1 = require("@nestjs/common");
const final_score_entity_1 = require("../entities/final-score.entity");
const score_calculation_service_1 = require("./score-calculation.service");
const engineer_level_vo_1 = require("../value-objects/engineer-level.vo");
let FinalScoreCalculationService = class FinalScoreCalculationService {
    constructor(scoreCalculationService) {
        this.scoreCalculationService = scoreCalculationService;
    }
    calculateFinalScore(evaluation) {
        const finalLevel = evaluation.proposedLevel || evaluation.employeeLevel || engineer_level_vo_1.EngineerLevel.MID;
        const weightedScore = this.scoreCalculationService.calculateWeightedScore(evaluation.scores, finalLevel);
        return final_score_entity_1.FinalScore.create({
            userId: evaluation.employeeId,
            cycleId: evaluation.cycleId,
            pillarScores: evaluation.scores,
            weightedScore,
            finalLevel,
        });
    }
};
exports.FinalScoreCalculationService = FinalScoreCalculationService;
exports.FinalScoreCalculationService = FinalScoreCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [score_calculation_service_1.ScoreCalculationService])
], FinalScoreCalculationService);
//# sourceMappingURL=final-score-calculation.service.js.map