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
exports.PeerFeedbackController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/guards/jwt-auth.guard");
const review_authorization_guard_1 = require("../guards/review-authorization.guard");
const review_exception_filter_1 = require("../filters/review-exception.filter");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const peer_feedback_dto_1 = require("../dto/peer-feedback.dto");
const nominate_peers_use_case_1 = require("../../application/use-cases/peer-feedback/nominate-peers.use-case");
const submit_peer_feedback_use_case_1 = require("../../application/use-cases/peer-feedback/submit-peer-feedback.use-case");
const get_aggregated_peer_feedback_use_case_1 = require("../../application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case");
const review_cycle_id_vo_1 = require("../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
let PeerFeedbackController = class PeerFeedbackController {
    constructor(nominatePeersUseCase, submitPeerFeedbackUseCase, getAggregatedPeerFeedbackUseCase) {
        this.nominatePeersUseCase = nominatePeersUseCase;
        this.submitPeerFeedbackUseCase = submitPeerFeedbackUseCase;
        this.getAggregatedPeerFeedbackUseCase = getAggregatedPeerFeedbackUseCase;
    }
    async nominatePeers(cycleId, user, dto) {
        const result = await this.nominatePeersUseCase.execute({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            nominatorId: user_id_vo_1.UserId.fromString(user.userId),
            nomineeIds: dto.peerIds.map(id => user_id_vo_1.UserId.fromString(id)),
        });
        return result.nominations.map(nom => ({
            id: nom.id,
            cycleId,
            nomineeId: nom.nomineeId,
            peerId: nom.nomineeId,
            peerEmail: 'peer@example.com',
            peerName: nom.nomineeName,
            status: nom.status,
            submittedAt: null,
        }));
    }
    async submitPeerFeedback(cycleId, revieweeId, user, dto) {
        const result = await this.submitPeerFeedbackUseCase.execute({
            revieweeId: user_id_vo_1.UserId.fromString(revieweeId),
            reviewerId: user_id_vo_1.UserId.fromString(user.userId),
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(cycleId),
            scores: {
                projectImpact: dto.projectImpact,
                direction: dto.direction,
                engineeringExcellence: dto.engineeringExcellence,
                operationalOwnership: dto.operationalOwnership,
                peopleImpact: dto.peopleImpact,
            },
            generalComments: dto.comments,
        });
        return {
            id: result.id,
            submittedAt: result.submittedAt.toISOString(),
        };
    }
    async getAggregatedPeerFeedback(cycleId, user) {
        const result = await this.getAggregatedPeerFeedbackUseCase.execute(user.userId, cycleId);
        return {
            avgProjectImpact: result.aggregatedScores.projectImpact,
            avgDirection: result.aggregatedScores.direction,
            avgEngineeringExcellence: result.aggregatedScores.engineeringExcellence,
            avgOperationalOwnership: result.aggregatedScores.operationalOwnership,
            avgPeopleImpact: result.aggregatedScores.peopleImpact,
            totalResponses: result.feedbackCount,
            anonymousComments: result.anonymizedComments.map(c => [c.pillar, c.comment].filter(Boolean).join(': ')),
        };
    }
};
exports.PeerFeedbackController = PeerFeedbackController;
__decorate([
    (0, common_1.Post)('nominations'),
    (0, swagger_1.ApiOperation)({ summary: 'Nominate peers for feedback' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Peers nominated successfully',
        type: [peer_feedback_dto_1.PeerNominationResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request or deadline passed' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, peer_feedback_dto_1.NominatePeersRequestDto]),
    __metadata("design:returntype", Promise)
], PeerFeedbackController.prototype, "nominatePeers", null);
__decorate([
    (0, common_1.Post)('reviewees/:revieweeId/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit peer feedback' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Peer feedback submitted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reviewee not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Deadline passed or already submitted' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Param)('revieweeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, peer_feedback_dto_1.SubmitPeerFeedbackRequestDto]),
    __metadata("design:returntype", Promise)
], PeerFeedbackController.prototype, "submitPeerFeedback", null);
__decorate([
    (0, common_1.Get)('aggregated'),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated peer feedback for current user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Aggregated peer feedback retrieved successfully',
        type: peer_feedback_dto_1.AggregatedPeerFeedbackResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No feedback found' }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PeerFeedbackController.prototype, "getAggregatedPeerFeedback", null);
exports.PeerFeedbackController = PeerFeedbackController = __decorate([
    (0, swagger_1.ApiTags)('Peer Feedback'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews/cycles/:cycleId/peer-feedback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, review_authorization_guard_1.ReviewAuthorizationGuard),
    (0, common_1.UseFilters)(review_exception_filter_1.ReviewExceptionFilter),
    __metadata("design:paramtypes", [nominate_peers_use_case_1.NominatePeersUseCase,
        submit_peer_feedback_use_case_1.SubmitPeerFeedbackUseCase,
        get_aggregated_peer_feedback_use_case_1.GetAggregatedPeerFeedbackUseCase])
], PeerFeedbackController);
//# sourceMappingURL=peer-feedback.controller.js.map