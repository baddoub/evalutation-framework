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
exports.GetAggregatedPeerFeedbackUseCase = void 0;
const common_1 = require("@nestjs/common");
const peer_feedback_aggregation_service_1 = require("../../../domain/services/peer-feedback-aggregation.service");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
let GetAggregatedPeerFeedbackUseCase = class GetAggregatedPeerFeedbackUseCase {
    constructor(peerFeedbackRepository, aggregationService) {
        this.peerFeedbackRepository = peerFeedbackRepository;
        this.aggregationService = aggregationService;
    }
    async execute(employeeId, cycleId) {
        const feedbackList = await this.peerFeedbackRepository.findByEmployeeAndCycle(user_id_vo_1.UserId.fromString(employeeId), review_cycle_id_vo_1.ReviewCycleId.create(cycleId));
        const aggregated = this.aggregationService.aggregateFeedback(feedbackList);
        return {
            employeeId,
            cycleId,
            aggregatedScores: {
                projectImpact: aggregated.projectImpact,
                direction: aggregated.direction,
                engineeringExcellence: aggregated.engineeringExcellence,
                operationalOwnership: aggregated.operationalOwnership,
                peopleImpact: aggregated.peopleImpact,
            },
            feedbackCount: feedbackList.length,
            anonymizedComments: aggregated.comments,
        };
    }
};
exports.GetAggregatedPeerFeedbackUseCase = GetAggregatedPeerFeedbackUseCase;
exports.GetAggregatedPeerFeedbackUseCase = GetAggregatedPeerFeedbackUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IPeerFeedbackRepository')),
    __metadata("design:paramtypes", [Object, peer_feedback_aggregation_service_1.PeerFeedbackAggregationService])
], GetAggregatedPeerFeedbackUseCase);
//# sourceMappingURL=get-aggregated-peer-feedback.use-case.js.map