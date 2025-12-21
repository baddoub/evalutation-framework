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
exports.GetFinalScoreUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
let GetFinalScoreUseCase = class GetFinalScoreUseCase {
    constructor(finalScoreRepository) {
        this.finalScoreRepository = finalScoreRepository;
    }
    async execute(employeeId, cycleId) {
        const finalScore = await this.finalScoreRepository.findByEmployeeAndCycle(user_id_vo_1.UserId.fromString(employeeId), review_cycle_id_vo_1.ReviewCycleId.create(cycleId));
        if (!finalScore) {
            return null;
        }
        return {
            id: finalScore.id.value,
            employeeId: finalScore.employeeId.value,
            cycleId: finalScore.cycleId.value,
            finalScores: {
                projectImpact: finalScore.finalScores.projectImpact.value,
                direction: finalScore.finalScores.direction.value,
                engineeringExcellence: finalScore.finalScores.engineeringExcellence.value,
                operationalOwnership: finalScore.finalScores.operationalOwnership.value,
                peopleImpact: finalScore.finalScores.peopleImpact.value,
            },
            weightedScore: finalScore.weightedScore.value,
            percentageScore: finalScore.percentageScore || 0,
            bonusTier: finalScore.bonusTier.value,
            finalLevel: finalScore.finalLevel.value,
            calculatedAt: finalScore.calculatedAt,
            feedbackDelivered: finalScore.feedbackDelivered,
            feedbackNotes: finalScore.feedbackNotes,
            deliveredAt: finalScore.deliveredAt,
            deliveredBy: finalScore.deliveredBy?.value,
        };
    }
};
exports.GetFinalScoreUseCase = GetFinalScoreUseCase;
exports.GetFinalScoreUseCase = GetFinalScoreUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IFinalScoreRepository')),
    __metadata("design:paramtypes", [Object])
], GetFinalScoreUseCase);
//# sourceMappingURL=get-final-score.use-case.js.map