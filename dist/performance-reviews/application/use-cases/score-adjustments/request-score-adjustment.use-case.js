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
exports.RequestScoreAdjustmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
let RequestScoreAdjustmentUseCase = class RequestScoreAdjustmentUseCase {
    constructor(scoreAdjustmentRequestRepository, finalScoreRepository, cycleRepository, userRepository) {
        this.scoreAdjustmentRequestRepository = scoreAdjustmentRequestRepository;
        this.finalScoreRepository = finalScoreRepository;
        this.cycleRepository = cycleRepository;
        this.userRepository = userRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const finalScore = await this.finalScoreRepository.findByUserAndCycle(input.employeeId, input.cycleId);
        if (!finalScore) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Final score not found');
        }
        if (!finalScore.isLocked) {
            throw new Error('Cannot request score adjustment until final scores are locked');
        }
        const employee = await this.userRepository.findById(input.employeeId);
        if (!employee) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Employee not found');
        }
        if (employee.managerId !== input.managerId.value) {
            throw new Error('You can only request adjustments for your direct reports');
        }
        const request = {
            id: require('crypto').randomUUID(),
            cycleId: input.cycleId,
            employeeId: input.employeeId,
            requesterId: input.managerId,
            reason: input.reason,
            status: 'PENDING',
            proposedScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: input.proposedScores.projectImpact,
                direction: input.proposedScores.direction,
                engineeringExcellence: input.proposedScores.engineeringExcellence,
                operationalOwnership: input.proposedScores.operationalOwnership,
                peopleImpact: input.proposedScores.peopleImpact,
            }),
            requestedAt: new Date(),
            approve: () => { },
            reject: () => { },
        };
        const savedRequest = await this.scoreAdjustmentRequestRepository.save(request);
        return {
            id: savedRequest.id,
            employeeId: savedRequest.employeeId.value,
            status: savedRequest.status,
            reason: savedRequest.reason,
            requestedAt: savedRequest.requestedAt,
        };
    }
};
exports.RequestScoreAdjustmentUseCase = RequestScoreAdjustmentUseCase;
exports.RequestScoreAdjustmentUseCase = RequestScoreAdjustmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IScoreAdjustmentRequestRepository')),
    __param(1, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(2, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(3, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], RequestScoreAdjustmentUseCase);
//# sourceMappingURL=request-score-adjustment.use-case.js.map