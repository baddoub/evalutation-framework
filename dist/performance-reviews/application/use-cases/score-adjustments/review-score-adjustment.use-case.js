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
exports.ReviewScoreAdjustmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let ReviewScoreAdjustmentUseCase = class ReviewScoreAdjustmentUseCase {
    constructor(scoreAdjustmentRequestRepository, finalScoreRepository, managerEvaluationRepository) {
        this.scoreAdjustmentRequestRepository = scoreAdjustmentRequestRepository;
        this.finalScoreRepository = finalScoreRepository;
        this.managerEvaluationRepository = managerEvaluationRepository;
    }
    async execute(input) {
        const request = await this.scoreAdjustmentRequestRepository.findById(input.requestId);
        if (!request) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Score adjustment request not found');
        }
        if (request.status !== 'PENDING') {
            throw new Error('Score adjustment request has already been reviewed');
        }
        const reviewedAt = new Date();
        request.status = input.action;
        request.approverId = input.approverId;
        request.reviewedAt = reviewedAt;
        if (input.action === 'REJECTED') {
            if (!input.rejectionReason) {
                throw new Error('Rejection reason is required when rejecting a request');
            }
            request.rejectionReason = input.rejectionReason;
        }
        if (input.action === 'APPROVED') {
            const finalScore = await this.finalScoreRepository.findByUserAndCycle(request.employeeId, request.cycleId);
            if (finalScore) {
                const managerEval = await this.managerEvaluationRepository.findByEmployeeAndCycle(request.employeeId, request.cycleId);
                if (managerEval) {
                    const newScores = pillar_scores_vo_1.PillarScores.create(request.proposedScores.toPlainObject());
                    managerEval.applyCalibrationAdjustment(newScores, `Score adjustment approved: ${request.reason}`);
                    await this.managerEvaluationRepository.save(managerEval);
                }
                await this.finalScoreRepository.save(finalScore);
            }
        }
        const updatedRequest = await this.scoreAdjustmentRequestRepository.save(request);
        return {
            id: updatedRequest.id,
            status: updatedRequest.status,
            reviewedAt,
            approvedBy: input.approverId.value,
        };
    }
};
exports.ReviewScoreAdjustmentUseCase = ReviewScoreAdjustmentUseCase;
exports.ReviewScoreAdjustmentUseCase = ReviewScoreAdjustmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IScoreAdjustmentRequestRepository')),
    __param(1, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(2, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], ReviewScoreAdjustmentUseCase);
//# sourceMappingURL=review-score-adjustment.use-case.js.map