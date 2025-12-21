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
exports.UpdateManagerEvaluationUseCase = void 0;
const common_1 = require("@nestjs/common");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const manager_evaluation_id_vo_1 = require("../../../domain/value-objects/manager-evaluation-id.vo");
let UpdateManagerEvaluationUseCase = class UpdateManagerEvaluationUseCase {
    constructor(managerEvaluationRepository) {
        this.managerEvaluationRepository = managerEvaluationRepository;
    }
    async execute(input) {
        let evaluation;
        if (input.evaluationId) {
            evaluation = await this.managerEvaluationRepository.findById(manager_evaluation_id_vo_1.ManagerEvaluationId.fromString(input.evaluationId));
        }
        else if (input.cycleId && input.employeeId) {
            evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(input.employeeId, input.cycleId);
        }
        if (!evaluation) {
            throw new Error('Manager evaluation not found');
        }
        if (input.scores) {
            const scores = pillar_scores_vo_1.PillarScores.create(input.scores);
            evaluation.updateScores(scores);
        }
        if (input.performanceNarrative) {
            evaluation.updatePerformanceNarrative(narrative_vo_1.Narrative.create(input.performanceNarrative));
        }
        if (input.growthAreas) {
            evaluation.updateGrowthAreas(narrative_vo_1.Narrative.create(input.growthAreas));
        }
        if (input.proposedLevel) {
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.create(input.proposedLevel));
        }
        if (input.managerComments) {
            evaluation.updatePerformanceNarrative(narrative_vo_1.Narrative.create(input.managerComments));
        }
        const savedEvaluation = await this.managerEvaluationRepository.save(evaluation);
        return {
            id: savedEvaluation.id.value,
            cycleId: savedEvaluation.cycleId.value,
            employeeId: savedEvaluation.employeeId.value,
            managerId: savedEvaluation.managerId.value,
            scores: savedEvaluation.scores.toObject(),
            managerComments: savedEvaluation.narrative,
            status: savedEvaluation.status.value,
            submittedAt: savedEvaluation.submittedAt,
            updatedAt: savedEvaluation.updatedAt,
        };
    }
};
exports.UpdateManagerEvaluationUseCase = UpdateManagerEvaluationUseCase;
exports.UpdateManagerEvaluationUseCase = UpdateManagerEvaluationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __metadata("design:paramtypes", [Object])
], UpdateManagerEvaluationUseCase);
//# sourceMappingURL=update-manager-evaluation.use-case.js.map