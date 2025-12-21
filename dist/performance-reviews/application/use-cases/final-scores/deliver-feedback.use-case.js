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
exports.DeliverFeedbackUseCase = void 0;
const common_1 = require("@nestjs/common");
const final_score_id_vo_1 = require("../../../domain/value-objects/final-score-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
let DeliverFeedbackUseCase = class DeliverFeedbackUseCase {
    constructor(finalScoreRepository) {
        this.finalScoreRepository = finalScoreRepository;
    }
    async execute(input) {
        const finalScore = await this.finalScoreRepository.findById(final_score_id_vo_1.FinalScoreId.fromString(input.finalScoreId));
        if (!finalScore) {
            throw new Error('Final score not found');
        }
        if (finalScore.isLocked) {
            throw new Error('Cannot deliver feedback on a locked final score');
        }
        finalScore.markFeedbackDelivered(user_id_vo_1.UserId.fromString(input.deliveredBy), input.feedbackNotes);
        const savedFinalScore = await this.finalScoreRepository.save(finalScore);
        return {
            id: savedFinalScore.id.value,
            employeeId: savedFinalScore.employeeId.value,
            cycleId: savedFinalScore.cycleId.value,
            feedbackDelivered: savedFinalScore.feedbackDelivered,
            feedbackNotes: savedFinalScore.feedbackNotes,
            deliveredAt: savedFinalScore.deliveredAt,
            deliveredBy: input.deliveredBy,
            weightedScore: savedFinalScore.weightedScore.value,
            percentageScore: savedFinalScore.percentageScore || 0,
            bonusTier: savedFinalScore.bonusTier.value,
        };
    }
};
exports.DeliverFeedbackUseCase = DeliverFeedbackUseCase;
exports.DeliverFeedbackUseCase = DeliverFeedbackUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IFinalScoreRepository')),
    __metadata("design:paramtypes", [Object])
], DeliverFeedbackUseCase);
//# sourceMappingURL=deliver-feedback.use-case.js.map