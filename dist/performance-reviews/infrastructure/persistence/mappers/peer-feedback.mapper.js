"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerFeedbackMapper = void 0;
const peer_feedback_entity_1 = require("../../../domain/entities/peer-feedback.entity");
const peer_feedback_id_vo_1 = require("../../../domain/value-objects/peer-feedback-id.vo");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
class PeerFeedbackMapper {
    static toDomain(prisma) {
        const scores = pillar_scores_vo_1.PillarScores.create({
            projectImpact: prisma.projectImpactScore,
            direction: prisma.directionScore,
            engineeringExcellence: prisma.engineeringExcellenceScore,
            operationalOwnership: prisma.operationalOwnershipScore,
            peopleImpact: prisma.peopleImpactScore,
        });
        const feedback = peer_feedback_entity_1.PeerFeedback.create({
            id: peer_feedback_id_vo_1.PeerFeedbackId.fromString(prisma.id),
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            revieweeId: user_id_vo_1.UserId.fromString(prisma.revieweeId),
            reviewerId: user_id_vo_1.UserId.fromString(prisma.reviewerId),
            scores,
            strengths: prisma.strengths ?? undefined,
            growthAreas: prisma.growthAreas ?? undefined,
            generalComments: prisma.generalComments ?? undefined,
        });
        const feedbackWithState = feedback;
        feedbackWithState._submittedAt = prisma.submittedAt;
        return feedbackWithState;
    }
    static toPrisma(domain) {
        return {
            id: domain.id.value,
            cycleId: domain.cycleId.value,
            revieweeId: domain.revieweeId.value,
            reviewerId: domain.reviewerId.value,
            projectImpactScore: domain.scores.projectImpact.value,
            directionScore: domain.scores.direction.value,
            engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
            operationalOwnershipScore: domain.scores.operationalOwnership.value,
            peopleImpactScore: domain.scores.peopleImpact.value,
            strengths: domain.strengths ?? null,
            growthAreas: domain.growthAreas ?? null,
            generalComments: domain.generalComments ?? null,
            submittedAt: domain.submittedAt ?? new Date(),
        };
    }
}
exports.PeerFeedbackMapper = PeerFeedbackMapper;
//# sourceMappingURL=peer-feedback.mapper.js.map