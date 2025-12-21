"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfReviewMapper = void 0;
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const self_review_id_vo_1 = require("../../../domain/value-objects/self-review-id.vo");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
class SelfReviewMapper {
    static toDomain(prisma) {
        const scores = pillar_scores_vo_1.PillarScores.create({
            projectImpact: prisma.projectImpactScore,
            direction: prisma.directionScore,
            engineeringExcellence: prisma.engineeringExcellenceScore,
            operationalOwnership: prisma.operationalOwnershipScore,
            peopleImpact: prisma.peopleImpactScore,
        });
        const narrative = narrative_vo_1.Narrative.fromText(prisma.narrative);
        const selfReview = self_review_entity_1.SelfReview.create({
            id: self_review_id_vo_1.SelfReviewId.fromString(prisma.id),
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            userId: user_id_vo_1.UserId.fromString(prisma.userId),
            scores,
            narrative,
        });
        const selfReviewWithState = selfReview;
        selfReviewWithState._status = review_status_vo_1.ReviewStatus.fromString(prisma.status);
        selfReviewWithState._submittedAt = prisma.submittedAt ?? undefined;
        return selfReviewWithState;
    }
    static toPrisma(domain) {
        return {
            id: domain.id.value,
            cycleId: domain.cycleId.value,
            userId: domain.userId.value,
            projectImpactScore: domain.scores.projectImpact.value,
            directionScore: domain.scores.direction.value,
            engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
            operationalOwnershipScore: domain.scores.operationalOwnership.value,
            peopleImpactScore: domain.scores.peopleImpact.value,
            narrative: domain.narrative.text,
            status: domain.status.value,
            submittedAt: domain.submittedAt ?? null,
        };
    }
}
exports.SelfReviewMapper = SelfReviewMapper;
//# sourceMappingURL=self-review.mapper.js.map