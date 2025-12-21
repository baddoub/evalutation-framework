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
exports.SubmitPeerFeedbackUseCase = void 0;
const common_1 = require("@nestjs/common");
const peer_feedback_entity_1 = require("../../../domain/entities/peer-feedback.entity");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let SubmitPeerFeedbackUseCase = class SubmitPeerFeedbackUseCase {
    constructor(peerFeedbackRepository, peerNominationRepository, cycleRepository) {
        this.peerFeedbackRepository = peerFeedbackRepository;
        this.peerNominationRepository = peerNominationRepository;
        this.cycleRepository = cycleRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        if (cycle.hasDeadlinePassed('peerFeedback')) {
            throw new Error('Peer feedback deadline has passed');
        }
        const nominations = await this.peerNominationRepository.findByNominatorAndCycle(input.revieweeId, input.cycleId);
        const nomination = nominations.find((nom) => nom.nomineeId.equals(input.reviewerId));
        if (!nomination) {
            throw new Error('No peer nomination found for this reviewer and reviewee');
        }
        if (nomination.status !== 'PENDING' && nomination.status !== 'ACCEPTED') {
            throw new Error('Peer nomination is not active');
        }
        const existingFeedback = await this.peerFeedbackRepository.findByReviewerAndCycle(input.reviewerId, input.cycleId);
        const alreadySubmitted = existingFeedback.some((fb) => fb.revieweeId.equals(input.revieweeId));
        if (alreadySubmitted) {
            throw new Error('Peer feedback already submitted for this reviewee');
        }
        const scores = pillar_scores_vo_1.PillarScores.create(input.scores);
        const feedback = peer_feedback_entity_1.PeerFeedback.create({
            cycleId: input.cycleId,
            revieweeId: input.revieweeId,
            reviewerId: input.reviewerId,
            scores,
            strengths: input.strengths,
            growthAreas: input.growthAreas,
            generalComments: input.generalComments,
        });
        const savedFeedback = await this.peerFeedbackRepository.save(feedback);
        return {
            id: savedFeedback.id.value,
            revieweeId: savedFeedback.revieweeId.value,
            submittedAt: savedFeedback.submittedAt,
            isAnonymized: savedFeedback.isAnonymized,
        };
    }
};
exports.SubmitPeerFeedbackUseCase = SubmitPeerFeedbackUseCase;
exports.SubmitPeerFeedbackUseCase = SubmitPeerFeedbackUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IPeerFeedbackRepository')),
    __param(1, (0, common_1.Inject)('IPeerNominationRepository')),
    __param(2, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], SubmitPeerFeedbackUseCase);
//# sourceMappingURL=submit-peer-feedback.use-case.js.map