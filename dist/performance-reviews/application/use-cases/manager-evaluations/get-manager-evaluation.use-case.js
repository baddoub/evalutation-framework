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
exports.GetManagerEvaluationUseCase = void 0;
const common_1 = require("@nestjs/common");
let GetManagerEvaluationUseCase = class GetManagerEvaluationUseCase {
    constructor(managerEvaluationRepository) {
        this.managerEvaluationRepository = managerEvaluationRepository;
    }
    async execute(input) {
        const evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(input.employeeId, input.cycleId);
        if (!evaluation) {
            return null;
        }
        return {
            id: evaluation.id.value,
            employeeId: evaluation.employeeId.value,
            managerId: evaluation.managerId.value,
            cycleId: evaluation.cycleId.value,
            scores: evaluation.scores.toPlainObject(),
            managerComments: evaluation.narrative,
            performanceNarrative: evaluation.performanceNarrative,
            growthAreas: evaluation.growthAreas,
            proposedLevel: evaluation.proposedLevel?.value,
            submittedAt: evaluation.submittedAt,
            status: evaluation.status.value,
        };
    }
};
exports.GetManagerEvaluationUseCase = GetManagerEvaluationUseCase;
exports.GetManagerEvaluationUseCase = GetManagerEvaluationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __metadata("design:paramtypes", [Object])
], GetManagerEvaluationUseCase);
//# sourceMappingURL=get-manager-evaluation.use-case.js.map