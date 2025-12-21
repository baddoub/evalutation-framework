"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const self_review_entity_1 = require("./self-review.entity");
const self_review_id_vo_1 = require("../value-objects/self-review-id.vo");
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../value-objects/narrative.vo");
const review_status_vo_1 = require("../value-objects/review-status.vo");
const self_review_already_submitted_exception_1 = require("../exceptions/self-review-already-submitted.exception");
describe('SelfReview', () => {
    const createValidProps = () => ({
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
        userId: user_id_vo_1.UserId.generate(),
        scores: pillar_scores_vo_1.PillarScores.create({
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
        }),
        narrative: narrative_vo_1.Narrative.create('This is my self-review narrative'),
    });
    describe('create', () => {
        it('should create a SelfReview with generated id in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview).toBeInstanceOf(self_review_entity_1.SelfReview);
            expect(selfReview.id).toBeInstanceOf(self_review_id_vo_1.SelfReviewId);
            expect(selfReview.cycleId).toBe(props.cycleId);
            expect(selfReview.userId).toBe(props.userId);
            expect(selfReview.scores).toBe(props.scores);
            expect(selfReview.narrative).toBe(props.narrative);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(selfReview.submittedAt).toBeUndefined();
            expect(selfReview.isSubmitted).toBe(false);
        });
        it('should create a SelfReview with provided id', () => {
            const props = createValidProps();
            const customId = self_review_id_vo_1.SelfReviewId.generate();
            const selfReview = self_review_entity_1.SelfReview.create({ ...props, id: customId });
            expect(selfReview.id).toBe(customId);
        });
        it('should create multiple SelfReviews with unique ids', () => {
            const props = createValidProps();
            const selfReview1 = self_review_entity_1.SelfReview.create(props);
            const selfReview2 = self_review_entity_1.SelfReview.create(props);
            expect(selfReview1.id).not.toBe(selfReview2.id);
        });
    });
    describe('updateScores', () => {
        it('should update scores when in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            });
            selfReview.updateScores(newScores);
            expect(selfReview.scores).toBe(newScores);
        });
        it('should throw error when updating scores after submission', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            });
            expect(() => selfReview.updateScores(newScores)).toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
            expect(() => selfReview.updateScores(newScores)).toThrow('Cannot update scores after submission');
        });
        it('should allow multiple updates while in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 1,
                direction: 1,
                engineeringExcellence: 1,
                operationalOwnership: 1,
                peopleImpact: 1,
            });
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            selfReview.updateScores(scores1);
            expect(selfReview.scores).toBe(scores1);
            selfReview.updateScores(scores2);
            expect(selfReview.scores).toBe(scores2);
        });
    });
    describe('updateNarrative', () => {
        it('should update narrative when in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const newNarrative = narrative_vo_1.Narrative.create('Updated narrative text');
            selfReview.updateNarrative(newNarrative);
            expect(selfReview.narrative).toBe(newNarrative);
        });
        it('should throw error when updating narrative after submission', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            const newNarrative = narrative_vo_1.Narrative.create('Updated narrative text');
            expect(() => selfReview.updateNarrative(newNarrative)).toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
            expect(() => selfReview.updateNarrative(newNarrative)).toThrow('Cannot update narrative after submission');
        });
        it('should allow multiple narrative updates while in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const narrative1 = narrative_vo_1.Narrative.create('First narrative');
            const narrative2 = narrative_vo_1.Narrative.create('Second narrative');
            selfReview.updateNarrative(narrative1);
            expect(selfReview.narrative).toBe(narrative1);
            selfReview.updateNarrative(narrative2);
            expect(selfReview.narrative).toBe(narrative2);
        });
    });
    describe('submit', () => {
        it('should submit a self-review in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const beforeSubmit = new Date();
            selfReview.submit();
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
            expect(selfReview.submittedAt).toBeDefined();
            expect(selfReview.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
            expect(selfReview.isSubmitted).toBe(true);
        });
        it('should throw error when submitting already submitted review', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            expect(() => selfReview.submit()).toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
        it('should prevent updates after submission', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newNarrative = narrative_vo_1.Narrative.create('New narrative');
            expect(() => selfReview.updateScores(newScores)).toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
            expect(() => selfReview.updateNarrative(newNarrative)).toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
    });
    describe('getters', () => {
        it('should expose all properties via getters', () => {
            const props = createValidProps();
            const customId = self_review_id_vo_1.SelfReviewId.generate();
            const selfReview = self_review_entity_1.SelfReview.create({ ...props, id: customId });
            expect(selfReview.id).toBe(customId);
            expect(selfReview.cycleId).toBe(props.cycleId);
            expect(selfReview.userId).toBe(props.userId);
            expect(selfReview.scores).toBe(props.scores);
            expect(selfReview.narrative).toBe(props.narrative);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(selfReview.submittedAt).toBeUndefined();
        });
        it('should expose submittedAt after submission', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview.submittedAt).toBeUndefined();
            selfReview.submit();
            expect(selfReview.submittedAt).toBeDefined();
            expect(selfReview.submittedAt).toBeInstanceOf(Date);
        });
    });
    describe('isSubmitted', () => {
        it('should return false for DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview.isSubmitted).toBe(false);
        });
        it('should return true for SUBMITTED status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            expect(selfReview.isSubmitted).toBe(true);
        });
        it('should return true for CALIBRATED status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            const selfReviewWithState = selfReview;
            selfReviewWithState._status = review_status_vo_1.ReviewStatus.CALIBRATED;
            expect(selfReview.isSubmitted).toBe(true);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED);
        });
    });
    describe('status transitions', () => {
        it('should start in DRAFT status', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(selfReview.isSubmitted).toBe(false);
        });
        it('should transition from DRAFT to SUBMITTED', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            selfReview.submit();
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
        });
        it('should not allow transition from SUBMITTED to DRAFT', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            selfReview.submit();
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
            expect(selfReview.isSubmitted).toBe(true);
        });
    });
    describe('edge cases', () => {
        it('should handle minimum valid narrative length', () => {
            const props = createValidProps();
            const minNarrative = narrative_vo_1.Narrative.create('a'.repeat(10));
            const selfReview = self_review_entity_1.SelfReview.create({ ...props, narrative: minNarrative });
            expect(selfReview.narrative).toBe(minNarrative);
        });
        it('should handle all zero scores', () => {
            const props = createValidProps();
            const zeroScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 0,
                direction: 0,
                engineeringExcellence: 0,
                operationalOwnership: 0,
                peopleImpact: 0,
            });
            const selfReview = self_review_entity_1.SelfReview.create({ ...props, scores: zeroScores });
            expect(selfReview.scores).toBe(zeroScores);
        });
        it('should handle maximum scores', () => {
            const props = createValidProps();
            const maxScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const selfReview = self_review_entity_1.SelfReview.create({ ...props, scores: maxScores });
            expect(selfReview.scores).toBe(maxScores);
        });
    });
    describe('workflow scenarios', () => {
        it('should support full draft-to-submit workflow', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(selfReview.isSubmitted).toBe(false);
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            selfReview.updateScores(scores1);
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            selfReview.updateScores(scores2);
            const narrative = narrative_vo_1.Narrative.create('Final narrative before submission');
            selfReview.updateNarrative(narrative);
            selfReview.submit();
            expect(selfReview.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
            expect(selfReview.isSubmitted).toBe(true);
            expect(selfReview.submittedAt).toBeDefined();
            expect(selfReview.scores).toBe(scores2);
            expect(selfReview.narrative).toBe(narrative);
        });
        it('should maintain immutability of submitted data', () => {
            const props = createValidProps();
            const selfReview = self_review_entity_1.SelfReview.create(props);
            const originalScores = props.scores;
            const originalNarrative = props.narrative;
            selfReview.submit();
            expect(selfReview.scores).toBe(originalScores);
            expect(selfReview.narrative).toBe(originalNarrative);
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            expect(() => selfReview.updateScores(newScores)).toThrow();
            expect(selfReview.scores).toBe(originalScores);
            expect(selfReview.narrative).toBe(originalNarrative);
        });
    });
});
//# sourceMappingURL=self-review.entity.spec.js.map