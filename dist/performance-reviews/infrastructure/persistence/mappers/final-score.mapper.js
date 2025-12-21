"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalScoreMapper = void 0;
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
class FinalScoreMapper {
    static toDomain(prisma) {
        const pillarScores = pillar_scores_vo_1.PillarScores.create({
            projectImpact: prisma.projectImpactScore,
            direction: prisma.directionScore,
            engineeringExcellence: prisma.engineeringExcellenceScore,
            operationalOwnership: prisma.operationalOwnershipScore,
            peopleImpact: prisma.peopleImpactScore,
        });
        const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(prisma.weightedScore);
        let peerAverageScores = undefined;
        if (prisma.peerAvgProjectImpact !== null &&
            prisma.peerAvgDirection !== null &&
            prisma.peerAvgEngineeringExcellence !== null &&
            prisma.peerAvgOperationalOwnership !== null &&
            prisma.peerAvgPeopleImpact !== null) {
            peerAverageScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: Math.round(prisma.peerAvgProjectImpact),
                direction: Math.round(prisma.peerAvgDirection),
                engineeringExcellence: Math.round(prisma.peerAvgEngineeringExcellence),
                operationalOwnership: Math.round(prisma.peerAvgOperationalOwnership),
                peopleImpact: Math.round(prisma.peerAvgPeopleImpact),
            });
        }
        const finalScore = final_score_entity_1.FinalScore.create({
            id: final_score_entity_1.FinalScoreId.fromString(prisma.id),
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            userId: user_id_vo_1.UserId.fromString(prisma.userId),
            pillarScores,
            weightedScore,
            finalLevel: engineer_level_vo_1.EngineerLevel.fromString(prisma.finalLevel || 'MID'),
            peerAverageScores,
            peerFeedbackCount: prisma.peerFeedbackCount ?? 0,
            calculatedAt: prisma.calculatedAt || prisma.createdAt,
            feedbackNotes: prisma.feedbackNotes ?? undefined,
            deliveredAt: prisma.feedbackDeliveredAt ?? undefined,
            deliveredBy: prisma.deliveredBy ? user_id_vo_1.UserId.fromString(prisma.deliveredBy) : undefined,
        });
        const finalScoreWithState = finalScore;
        finalScoreWithState._locked = prisma.locked;
        finalScoreWithState._lockedAt = prisma.lockedAt ?? undefined;
        finalScoreWithState._feedbackDelivered = prisma.feedbackDelivered;
        finalScoreWithState._feedbackDeliveredAt = prisma.feedbackDeliveredAt ?? undefined;
        return finalScoreWithState;
    }
    static toPrisma(domain) {
        return {
            id: domain.id.value,
            cycleId: domain.cycleId.value,
            userId: domain.userId.value,
            projectImpactScore: domain.pillarScores.projectImpact.value,
            directionScore: domain.pillarScores.direction.value,
            engineeringExcellenceScore: domain.pillarScores.engineeringExcellence.value,
            operationalOwnershipScore: domain.pillarScores.operationalOwnership.value,
            peopleImpactScore: domain.pillarScores.peopleImpact.value,
            weightedScore: domain.weightedScore.value,
            percentageScore: domain.percentageScore,
            bonusTier: domain.bonusTier.value,
            finalLevel: domain.finalLevel.value,
            calculatedAt: domain.calculatedAt,
            peerAvgProjectImpact: domain.peerAverageScores?.projectImpact.value ?? null,
            peerAvgDirection: domain.peerAverageScores?.direction.value ?? null,
            peerAvgEngineeringExcellence: domain.peerAverageScores?.engineeringExcellence.value ?? null,
            peerAvgOperationalOwnership: domain.peerAverageScores?.operationalOwnership.value ?? null,
            peerAvgPeopleImpact: domain.peerAverageScores?.peopleImpact.value ?? null,
            peerFeedbackCount: domain.peerFeedbackCount,
            locked: domain.isLocked,
            lockedAt: domain.lockedAt ?? null,
            feedbackDelivered: domain.feedbackDelivered,
            feedbackDeliveredAt: domain.deliveredAt ?? null,
            feedbackNotes: domain.feedbackNotes ?? null,
            deliveredBy: domain.deliveredBy?.value ?? null,
        };
    }
}
exports.FinalScoreMapper = FinalScoreMapper;
//# sourceMappingURL=final-score.mapper.js.map