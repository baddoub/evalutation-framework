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
exports.GetPeerFeedbackUseCase = void 0;
const common_1 = require("@nestjs/common");
const peer_feedback_aggregation_service_1 = require("../../../domain/services/peer-feedback-aggregation.service");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let GetPeerFeedbackUseCase = class GetPeerFeedbackUseCase {
    constructor(peerFeedbackRepository, cycleRepository, aggregationService) {
        this.peerFeedbackRepository = peerFeedbackRepository;
        this.cycleRepository = cycleRepository;
        this.aggregationService = aggregationService;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const feedbacks = await this.peerFeedbackRepository.findByRevieweeAndCycle(input.revieweeId, input.cycleId);
        if (feedbacks.length === 0) {
            return {
                aggregatedScores: {
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                },
                feedbackCount: 0,
                anonymizedComments: [],
            };
        }
        const anonymizedFeedback = this.aggregationService.anonymizeFeedback(feedbacks);
        const avgScores = anonymizedFeedback.averageScores.toObject();
        const anonymizedComments = [];
        feedbacks.forEach((feedback) => {
            const comment = {};
            if (feedback.strengths) {
                comment.strengths = feedback.strengths;
            }
            if (feedback.growthAreas) {
                comment.growthAreas = feedback.growthAreas;
            }
            if (feedback.generalComments) {
                comment.generalComments = feedback.generalComments;
            }
            if (Object.keys(comment).length > 0) {
                anonymizedComments.push(comment);
            }
        });
        return {
            aggregatedScores: {
                projectImpact: avgScores.projectImpact,
                direction: avgScores.direction,
                engineeringExcellence: avgScores.engineeringExcellence,
                operationalOwnership: avgScores.operationalOwnership,
                peopleImpact: avgScores.peopleImpact,
            },
            feedbackCount: anonymizedFeedback.feedbackCount,
            anonymizedComments,
        };
    }
};
exports.GetPeerFeedbackUseCase = GetPeerFeedbackUseCase;
exports.GetPeerFeedbackUseCase = GetPeerFeedbackUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IPeerFeedbackRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object, peer_feedback_aggregation_service_1.PeerFeedbackAggregationService])
], GetPeerFeedbackUseCase);
//# sourceMappingURL=get-peer-feedback.use-case.js.map