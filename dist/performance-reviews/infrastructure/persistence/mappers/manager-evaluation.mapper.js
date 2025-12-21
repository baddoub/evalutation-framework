"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerEvaluationMapper = void 0;
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
class ManagerEvaluationMapper {
    static toDomain(prisma) {
        const scores = pillar_scores_vo_1.PillarScores.create({
            projectImpact: prisma.projectImpactScore,
            direction: prisma.directionScore,
            engineeringExcellence: prisma.engineeringExcellenceScore,
            operationalOwnership: prisma.operationalOwnershipScore,
            peopleImpact: prisma.peopleImpactScore,
        });
        const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
            id: manager_evaluation_entity_1.ManagerEvaluationId.fromString(prisma.id),
            cycleId: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.cycleId),
            employeeId: user_id_vo_1.UserId.fromString(prisma.employeeId),
            managerId: user_id_vo_1.UserId.fromString(prisma.managerId),
            scores,
            narrative: prisma.narrative,
            strengths: prisma.strengths,
            growthAreas: prisma.growthAreas,
            developmentPlan: prisma.developmentPlan,
            createdAt: prisma.createdAt,
            updatedAt: prisma.updatedAt,
        });
        const evaluationWithState = evaluation;
        evaluationWithState._status = review_status_vo_1.ReviewStatus.fromString(prisma.status);
        evaluationWithState._submittedAt = prisma.submittedAt ?? undefined;
        evaluationWithState._calibratedAt = prisma.calibratedAt ?? undefined;
        return evaluationWithState;
    }
    static toPrisma(domain) {
        return {
            id: domain.id.value,
            cycleId: domain.cycleId.value,
            employeeId: domain.employeeId.value,
            managerId: domain.managerId.value,
            projectImpactScore: domain.scores.projectImpact.value,
            directionScore: domain.scores.direction.value,
            engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
            operationalOwnershipScore: domain.scores.operationalOwnership.value,
            peopleImpactScore: domain.scores.peopleImpact.value,
            narrative: domain.narrative,
            strengths: domain.strengths,
            growthAreas: domain.growthAreas,
            developmentPlan: domain.developmentPlan,
            status: domain.status.value,
            submittedAt: domain.submittedAt ?? null,
            calibratedAt: domain.calibratedAt ?? null,
        };
    }
}
exports.ManagerEvaluationMapper = ManagerEvaluationMapper;
//# sourceMappingURL=manager-evaluation.mapper.js.map