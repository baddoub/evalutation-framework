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
exports.SubmitManagerEvaluationUseCase = void 0;
const common_1 = require("@nestjs/common");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let SubmitManagerEvaluationUseCase = class SubmitManagerEvaluationUseCase {
    constructor(managerEvaluationRepository, cycleRepository, userRepository) {
        this.managerEvaluationRepository = managerEvaluationRepository;
        this.cycleRepository = cycleRepository;
        this.userRepository = userRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        if (cycle.hasDeadlinePassed('managerEvaluation')) {
            throw new Error('Manager evaluation deadline has passed');
        }
        const employee = await this.userRepository.findById(input.employeeId);
        if (!employee) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Employee not found');
        }
        if (employee.managerId !== input.managerId.value) {
            throw new Error('You can only evaluate your direct reports');
        }
        let evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(input.employeeId, input.cycleId);
        const scores = pillar_scores_vo_1.PillarScores.create(input.scores);
        if (!evaluation) {
            evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                cycleId: input.cycleId,
                employeeId: input.employeeId,
                managerId: input.managerId,
                scores,
                narrative: input.narrative,
                strengths: input.strengths,
                growthAreas: input.growthAreas,
                developmentPlan: input.developmentPlan,
            });
        }
        else {
            evaluation.updateScores(scores);
        }
        evaluation.submit();
        const savedEvaluation = await this.managerEvaluationRepository.save(evaluation);
        const savedScores = savedEvaluation.scores.toObject();
        return {
            id: savedEvaluation.id.value,
            employeeId: savedEvaluation.employeeId.value,
            status: savedEvaluation.status.value,
            scores: savedScores,
            submittedAt: savedEvaluation.submittedAt,
        };
    }
};
exports.SubmitManagerEvaluationUseCase = SubmitManagerEvaluationUseCase;
exports.SubmitManagerEvaluationUseCase = SubmitManagerEvaluationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(2, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], SubmitManagerEvaluationUseCase);
//# sourceMappingURL=submit-manager-evaluation.use-case.js.map