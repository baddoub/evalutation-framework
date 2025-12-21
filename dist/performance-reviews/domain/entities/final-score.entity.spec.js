"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const final_score_entity_1 = require("./final-score.entity");
const final_score_id_vo_1 = require("../value-objects/final-score-id.vo");
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../value-objects/weighted-score.vo");
const bonus_tier_vo_1 = require("../value-objects/bonus-tier.vo");
const engineer_level_vo_1 = require("../value-objects/engineer-level.vo");
const final_score_locked_exception_1 = require("../exceptions/final-score-locked.exception");
describe('FinalScore', () => {
    const createValidProps = () => ({
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
        userId: user_id_vo_1.UserId.generate(),
        pillarScores: pillar_scores_vo_1.PillarScores.create({
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
        }),
        weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.2),
        finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
    });
    describe('create', () => {
        it('should create a FinalScore with required properties', () => {
            const props = createValidProps();
            const beforeCreate = new Date();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const afterCreate = new Date();
            expect(finalScore).toBeInstanceOf(final_score_entity_1.FinalScore);
            expect(finalScore.id).toBeInstanceOf(final_score_id_vo_1.FinalScoreId);
            expect(finalScore.cycleId).toBe(props.cycleId);
            expect(finalScore.userId).toBe(props.userId);
            expect(finalScore.employeeId).toBe(props.userId);
            expect(finalScore.pillarScores).toBe(props.pillarScores);
            expect(finalScore.finalScores).toBe(props.pillarScores);
            expect(finalScore.weightedScore).toBe(props.weightedScore);
            expect(finalScore.finalLevel).toBe(props.finalLevel);
            expect(finalScore.peerAverageScores).toBeNull();
            expect(finalScore.peerFeedbackCount).toBe(0);
            expect(finalScore.isLocked).toBe(false);
            expect(finalScore.lockedAt).toBeUndefined();
            expect(finalScore.feedbackDelivered).toBe(false);
            expect(finalScore.feedbackDeliveredAt).toBeUndefined();
            expect(finalScore.calculatedAt).toBeDefined();
            expect(finalScore.calculatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(finalScore.calculatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        });
        it('should create a FinalScore with provided id', () => {
            const props = createValidProps();
            const customId = final_score_id_vo_1.FinalScoreId.generate();
            const finalScore = final_score_entity_1.FinalScore.create({ ...props, id: customId });
            expect(finalScore.id).toBe(customId);
        });
        it('should create a FinalScore with peer feedback data', () => {
            const props = createValidProps();
            const peerScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                peerAverageScores: peerScores,
                peerFeedbackCount: 5,
            });
            expect(finalScore.peerAverageScores).toBe(peerScores);
            expect(finalScore.peerFeedbackCount).toBe(5);
        });
        it('should create a FinalScore with custom calculatedAt', () => {
            const props = createValidProps();
            const customDate = new Date('2024-01-01');
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                calculatedAt: customDate,
            });
            expect(finalScore.calculatedAt).toBe(customDate);
        });
        it('should create a FinalScore with feedback notes', () => {
            const props = createValidProps();
            const feedbackNotes = 'Great work this cycle';
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                feedbackNotes,
            });
            expect(finalScore.feedbackNotes).toBe(feedbackNotes);
        });
        it('should create a FinalScore with delivery information', () => {
            const props = createValidProps();
            const deliveredBy = user_id_vo_1.UserId.generate();
            const deliveredAt = new Date('2024-02-01');
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                deliveredAt,
                deliveredBy,
            });
            expect(finalScore.deliveredAt).toBe(deliveredAt);
            expect(finalScore.deliveredBy).toBe(deliveredBy);
        });
        it('should create multiple FinalScores with unique ids', () => {
            const props = createValidProps();
            const finalScore1 = final_score_entity_1.FinalScore.create(props);
            const finalScore2 = final_score_entity_1.FinalScore.create(props);
            expect(finalScore1.id).not.toBe(finalScore2.id);
        });
    });
    describe('lock', () => {
        it('should lock an unlocked final score', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.isLocked).toBe(false);
            expect(finalScore.lockedAt).toBeUndefined();
            const beforeLock = new Date();
            finalScore.lock();
            const afterLock = new Date();
            expect(finalScore.isLocked).toBe(true);
            expect(finalScore.lockedAt).toBeDefined();
            expect(finalScore.lockedAt.getTime()).toBeGreaterThanOrEqual(beforeLock.getTime());
            expect(finalScore.lockedAt.getTime()).toBeLessThanOrEqual(afterLock.getTime());
        });
        it('should be idempotent - locking already locked score has no effect', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            const firstLockedAt = finalScore.lockedAt;
            finalScore.lock();
            expect(finalScore.isLocked).toBe(true);
            expect(finalScore.lockedAt).toBe(firstLockedAt);
        });
    });
    describe('unlock', () => {
        it('should unlock a locked final score', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            expect(finalScore.isLocked).toBe(true);
            finalScore.unlock();
            expect(finalScore.isLocked).toBe(false);
            expect(finalScore.lockedAt).toBeUndefined();
        });
        it('should be idempotent - unlocking already unlocked score has no effect', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.isLocked).toBe(false);
            finalScore.unlock();
            expect(finalScore.isLocked).toBe(false);
            expect(finalScore.lockedAt).toBeUndefined();
        });
        it('should allow locking and unlocking multiple times', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            expect(finalScore.isLocked).toBe(true);
            finalScore.unlock();
            expect(finalScore.isLocked).toBe(false);
            finalScore.lock();
            expect(finalScore.isLocked).toBe(true);
            finalScore.unlock();
            expect(finalScore.isLocked).toBe(false);
        });
    });
    describe('updateScores', () => {
        it('should update scores when unlocked', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const newPillarScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newWeightedScore = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            finalScore.updateScores(newPillarScores, newWeightedScore);
            expect(finalScore.pillarScores).toBe(newPillarScores);
            expect(finalScore.weightedScore).toBe(newWeightedScore);
        });
        it('should throw error when updating scores while locked', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            const newPillarScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newWeightedScore = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow(final_score_locked_exception_1.FinalScoreLockedException);
            expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow('Cannot update scores when final score is locked');
        });
        it('should allow updates after unlocking', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            const newPillarScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newWeightedScore = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow();
            finalScore.unlock();
            finalScore.updateScores(newPillarScores, newWeightedScore);
            expect(finalScore.pillarScores).toBe(newPillarScores);
            expect(finalScore.weightedScore).toBe(newWeightedScore);
        });
        it('should allow multiple score updates while unlocked', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            const weighted1 = weighted_score_vo_1.WeightedScore.fromValue(2.0);
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const weighted2 = weighted_score_vo_1.WeightedScore.fromValue(3.0);
            finalScore.updateScores(scores1, weighted1);
            expect(finalScore.pillarScores).toBe(scores1);
            expect(finalScore.weightedScore).toBe(weighted1);
            finalScore.updateScores(scores2, weighted2);
            expect(finalScore.pillarScores).toBe(scores2);
            expect(finalScore.weightedScore).toBe(weighted2);
        });
    });
    describe('markFeedbackDelivered', () => {
        it('should mark feedback as delivered', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const deliveredBy = user_id_vo_1.UserId.generate();
            expect(finalScore.feedbackDelivered).toBe(false);
            expect(finalScore.feedbackDeliveredAt).toBeUndefined();
            expect(finalScore.deliveredBy).toBeUndefined();
            const beforeDelivery = new Date();
            finalScore.markFeedbackDelivered(deliveredBy);
            const afterDelivery = new Date();
            expect(finalScore.feedbackDelivered).toBe(true);
            expect(finalScore.feedbackDeliveredAt).toBeDefined();
            expect(finalScore.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(beforeDelivery.getTime());
            expect(finalScore.feedbackDeliveredAt.getTime()).toBeLessThanOrEqual(afterDelivery.getTime());
            expect(finalScore.deliveredAt).toBeDefined();
            expect(finalScore.deliveredBy).toBe(deliveredBy);
        });
        it('should mark feedback as delivered with notes', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const deliveredBy = user_id_vo_1.UserId.generate();
            const feedbackNotes = 'Feedback session completed successfully';
            finalScore.markFeedbackDelivered(deliveredBy, feedbackNotes);
            expect(finalScore.feedbackDelivered).toBe(true);
            expect(finalScore.feedbackNotes).toBe(feedbackNotes);
            expect(finalScore.deliveredBy).toBe(deliveredBy);
        });
        it('should update feedback notes if already set', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                feedbackNotes: 'Initial notes',
            });
            const deliveredBy = user_id_vo_1.UserId.generate();
            const newNotes = 'Updated notes after delivery';
            finalScore.markFeedbackDelivered(deliveredBy, newNotes);
            expect(finalScore.feedbackNotes).toBe(newNotes);
        });
        it('should allow marking as delivered multiple times', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const deliveredBy1 = user_id_vo_1.UserId.generate();
            const deliveredBy2 = user_id_vo_1.UserId.generate();
            finalScore.markFeedbackDelivered(deliveredBy1, 'First delivery');
            const firstDeliveryAt = finalScore.feedbackDeliveredAt;
            finalScore.markFeedbackDelivered(deliveredBy2, 'Second delivery');
            expect(finalScore.feedbackDelivered).toBe(true);
            expect(finalScore.deliveredBy).toBe(deliveredBy2);
            expect(finalScore.feedbackNotes).toBe('Second delivery');
            expect(finalScore.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(firstDeliveryAt.getTime());
        });
    });
    describe('getters', () => {
        it('should expose all properties via getters', () => {
            const props = createValidProps();
            const customId = final_score_id_vo_1.FinalScoreId.generate();
            const peerScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const deliveredBy = user_id_vo_1.UserId.generate();
            const deliveredAt = new Date('2024-02-01');
            const calculatedAt = new Date('2024-01-01');
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                id: customId,
                peerAverageScores: peerScores,
                peerFeedbackCount: 5,
                calculatedAt,
                feedbackNotes: 'Great work',
                deliveredAt,
                deliveredBy,
            });
            expect(finalScore.id).toBe(customId);
            expect(finalScore.cycleId).toBe(props.cycleId);
            expect(finalScore.userId).toBe(props.userId);
            expect(finalScore.employeeId).toBe(props.userId);
            expect(finalScore.pillarScores).toBe(props.pillarScores);
            expect(finalScore.finalScores).toBe(props.pillarScores);
            expect(finalScore.weightedScore).toBe(props.weightedScore);
            expect(finalScore.finalLevel).toBe(props.finalLevel);
            expect(finalScore.peerAverageScores).toBe(peerScores);
            expect(finalScore.peerFeedbackCount).toBe(5);
            expect(finalScore.calculatedAt).toBe(calculatedAt);
            expect(finalScore.feedbackNotes).toBe('Great work');
            expect(finalScore.deliveredAt).toBe(deliveredAt);
            expect(finalScore.deliveredBy).toBe(deliveredBy);
        });
        it('should return undefined for optional properties when not set', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.peerAverageScores).toBeNull();
            expect(finalScore.lockedAt).toBeUndefined();
            expect(finalScore.feedbackDeliveredAt).toBeUndefined();
            expect(finalScore.feedbackNotes).toBeUndefined();
            expect(finalScore.deliveredAt).toBeUndefined();
            expect(finalScore.deliveredBy).toBeUndefined();
        });
    });
    describe('percentageScore', () => {
        it('should return percentage from weighted score', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.2),
            });
            expect(finalScore.percentageScore).toBe(80);
        });
        it('should calculate percentage for minimum score', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(0),
            });
            expect(finalScore.percentageScore).toBe(0);
        });
        it('should calculate percentage for maximum score', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(4.0),
            });
            expect(finalScore.percentageScore).toBe(100);
        });
    });
    describe('bonusTier', () => {
        it('should return EXCEEDS tier for scores >= 85%', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.4),
            });
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.EXCEEDS);
            expect(finalScore.bonusTier.isExceeds()).toBe(true);
        });
        it('should return MEETS tier for scores between 50% and 84%', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(2.4),
            });
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.MEETS);
            expect(finalScore.bonusTier.isMeets()).toBe(true);
        });
        it('should return BELOW tier for scores < 50%', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(1.6),
            });
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.BELOW);
            expect(finalScore.bonusTier.isBelow()).toBe(true);
        });
    });
    describe('edge cases', () => {
        it('should handle all zero scores', () => {
            const props = createValidProps();
            const zeroScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 0,
                direction: 0,
                engineeringExcellence: 0,
                operationalOwnership: 0,
                peopleImpact: 0,
            });
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                pillarScores: zeroScores,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(0),
            });
            expect(finalScore.pillarScores).toBe(zeroScores);
            expect(finalScore.weightedScore.value).toBe(0);
            expect(finalScore.percentageScore).toBe(0);
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.BELOW);
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
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                pillarScores: maxScores,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(4.0),
            });
            expect(finalScore.pillarScores).toBe(maxScores);
            expect(finalScore.weightedScore.value).toBe(4.0);
            expect(finalScore.percentageScore).toBe(100);
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.EXCEEDS);
        });
        it('should handle all engineer levels', () => {
            const props = createValidProps();
            const levels = [
                engineer_level_vo_1.EngineerLevel.JUNIOR,
                engineer_level_vo_1.EngineerLevel.MID,
                engineer_level_vo_1.EngineerLevel.SENIOR,
                engineer_level_vo_1.EngineerLevel.LEAD,
                engineer_level_vo_1.EngineerLevel.MANAGER,
            ];
            levels.forEach((level) => {
                const finalScore = final_score_entity_1.FinalScore.create({
                    ...props,
                    finalLevel: level,
                });
                expect(finalScore.finalLevel).toBe(level);
            });
        });
        it('should handle zero peer feedback count', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                peerFeedbackCount: 0,
            });
            expect(finalScore.peerFeedbackCount).toBe(0);
            expect(finalScore.peerAverageScores).toBeNull();
        });
        it('should handle large peer feedback count', () => {
            const props = createValidProps();
            const peerScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                peerAverageScores: peerScores,
                peerFeedbackCount: 100,
            });
            expect(finalScore.peerFeedbackCount).toBe(100);
            expect(finalScore.peerAverageScores).toBe(peerScores);
        });
        it('should handle very long feedback notes', () => {
            const props = createValidProps();
            const longNotes = 'a'.repeat(10000);
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                feedbackNotes: longNotes,
            });
            expect(finalScore.feedbackNotes).toBe(longNotes);
        });
        it('should handle empty feedback notes', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create({
                ...props,
                feedbackNotes: '',
            });
            expect(finalScore.feedbackNotes).toBe('');
        });
    });
    describe('workflow scenarios', () => {
        it('should support complete calculation-to-delivery workflow', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.isLocked).toBe(false);
            expect(finalScore.feedbackDelivered).toBe(false);
            const updatedScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const updatedWeighted = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            finalScore.updateScores(updatedScores, updatedWeighted);
            finalScore.lock();
            expect(finalScore.isLocked).toBe(true);
            const deliveredBy = user_id_vo_1.UserId.generate();
            finalScore.markFeedbackDelivered(deliveredBy, 'Excellent performance');
            expect(finalScore.feedbackDelivered).toBe(true);
            expect(finalScore.deliveredBy).toBe(deliveredBy);
            expect(finalScore.feedbackNotes).toBe('Excellent performance');
            expect(finalScore.pillarScores).toBe(updatedScores);
            expect(finalScore.weightedScore).toBe(updatedWeighted);
            expect(finalScore.isLocked).toBe(true);
            expect(finalScore.percentageScore).toBe(100);
            expect(finalScore.bonusTier).toBe(bonus_tier_vo_1.BonusTier.EXCEEDS);
        });
        it('should support admin unlock workflow', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            finalScore.lock();
            const deliveredBy = user_id_vo_1.UserId.generate();
            finalScore.markFeedbackDelivered(deliveredBy, 'Initial feedback');
            expect(finalScore.isLocked).toBe(true);
            expect(finalScore.feedbackDelivered).toBe(true);
            finalScore.unlock();
            const correctedScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const correctedWeighted = weighted_score_vo_1.WeightedScore.fromValue(3.0);
            finalScore.updateScores(correctedScores, correctedWeighted);
            finalScore.lock();
            finalScore.markFeedbackDelivered(deliveredBy, 'Corrected feedback');
            expect(finalScore.isLocked).toBe(true);
            expect(finalScore.feedbackNotes).toBe('Corrected feedback');
            expect(finalScore.pillarScores).toBe(correctedScores);
        });
        it('should prevent modifications to locked scores', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const originalScores = props.pillarScores;
            const originalWeighted = props.weightedScore;
            finalScore.lock();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newWeighted = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            expect(() => finalScore.updateScores(newScores, newWeighted)).toThrow(final_score_locked_exception_1.FinalScoreLockedException);
            expect(finalScore.pillarScores).toBe(originalScores);
            expect(finalScore.weightedScore).toBe(originalWeighted);
        });
    });
    describe('immutability', () => {
        it('should not allow modification of id after creation', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const originalId = finalScore.id;
            expect(finalScore.id).toBe(originalId);
            expect(finalScore.id).toBe(originalId);
        });
        it('should not allow modification of userId after creation', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const originalUserId = finalScore.userId;
            expect(finalScore.userId).toBe(originalUserId);
            expect(finalScore.employeeId).toBe(originalUserId);
        });
        it('should not allow modification of cycleId after creation', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const originalCycleId = finalScore.cycleId;
            expect(finalScore.cycleId).toBe(originalCycleId);
            expect(finalScore.cycleId).toBe(originalCycleId);
        });
        it('should allow modification of scores only when unlocked', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newWeighted = weighted_score_vo_1.WeightedScore.fromValue(4.0);
            finalScore.updateScores(newScores, newWeighted);
            expect(finalScore.pillarScores).toBe(newScores);
            finalScore.lock();
            const attemptedScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            const attemptedWeighted = weighted_score_vo_1.WeightedScore.fromValue(2.0);
            expect(() => finalScore.updateScores(attemptedScores, attemptedWeighted)).toThrow();
            expect(finalScore.pillarScores).toBe(newScores);
        });
    });
    describe('alias getters', () => {
        it('should provide employeeId as alias for userId', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.employeeId).toBe(finalScore.userId);
            expect(finalScore.employeeId).toBe(props.userId);
        });
        it('should provide finalScores as alias for pillarScores', () => {
            const props = createValidProps();
            const finalScore = final_score_entity_1.FinalScore.create(props);
            expect(finalScore.finalScores).toBe(finalScore.pillarScores);
            expect(finalScore.finalScores).toBe(props.pillarScores);
        });
    });
});
//# sourceMappingURL=final-score.entity.spec.js.map