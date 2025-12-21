"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCycleMapper = void 0;
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
class ReviewCycleMapper {
    static toDomain(prisma) {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: prisma.selfReviewDeadline,
            peerFeedback: prisma.peerFeedbackDeadline,
            managerEvaluation: prisma.managerEvalDeadline,
            calibration: prisma.calibrationDeadline,
            feedbackDelivery: prisma.feedbackDeliveryDeadline,
        });
        const cycle = review_cycle_entity_1.ReviewCycle.create({
            id: review_cycle_id_vo_1.ReviewCycleId.fromString(prisma.id),
            name: prisma.name,
            year: prisma.year,
            deadlines,
            startDate: prisma.startDate,
        });
        const cycleWithState = cycle;
        cycleWithState._status = review_cycle_entity_1.CycleStatus.fromString(prisma.status);
        cycleWithState._endDate = prisma.endDate ?? undefined;
        return cycleWithState;
    }
    static toPrisma(domain) {
        return {
            id: domain.id.value,
            name: domain.name,
            year: domain.year,
            status: domain.status.value,
            selfReviewDeadline: domain.deadlines.selfReview,
            peerFeedbackDeadline: domain.deadlines.peerFeedback,
            managerEvalDeadline: domain.deadlines.managerEvaluation,
            calibrationDeadline: domain.deadlines.calibration,
            feedbackDeliveryDeadline: domain.deadlines.feedbackDelivery,
            startDate: domain.startDate,
            endDate: domain.endDate ?? null,
        };
    }
}
exports.ReviewCycleMapper = ReviewCycleMapper;
//# sourceMappingURL=review-cycle.mapper.js.map