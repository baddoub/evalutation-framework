"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const submit_self_review_use_case_1 = require("./submit-self-review.use-case");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const self_review_already_submitted_exception_1 = require("../../../domain/exceptions/self-review-already-submitted.exception");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
describe('SubmitSelfReviewUseCase', () => {
    let useCase;
    let mockSelfReviewRepository;
    let mockCycleRepository;
    const createValidReviewCycle = () => {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: new Date('2025-12-31'),
            peerFeedback: new Date('2026-01-15'),
            managerEvaluation: new Date('2026-01-31'),
            calibration: new Date('2026-02-28'),
            feedbackDelivery: new Date('2026-03-31'),
        });
        const cycle = review_cycle_entity_1.ReviewCycle.create({
            name: 'Performance Review 2025',
            year: 2025,
            deadlines,
            startDate: new Date('2025-01-01'),
        });
        return cycle;
    };
    const createValidSelfReview = (overrides) => {
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const userId = overrides?.userId || user_id_vo_1.UserId.generate();
        return self_review_entity_1.SelfReview.create({
            id: overrides?.id,
            cycleId,
            userId,
            scores: overrides?.scores ||
                pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
            narrative: overrides?.narrative || narrative_vo_1.Narrative.create('This is my self-review narrative'),
        });
    };
    beforeEach(() => {
        mockSelfReviewRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        mockCycleRepository = {
            findById: jest.fn(),
            findByYear: jest.fn(),
            findActive: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new submit_self_review_use_case_1.SubmitSelfReviewUseCase(mockSelfReviewRepository, mockCycleRepository);
    });
    describe('successful submission', () => {
        it('should submit draft review successfully (DRAFT → SUBMITTED)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            expect(result).toEqual({
                id: submittedReview.id.value,
                status: review_status_vo_1.ReviewStatus.SUBMITTED.value,
                submittedAt: submittedReview.submittedAt,
            });
            expect(result.status).toBe('SUBMITTED');
            expect(result.submittedAt).toBeInstanceOf(Date);
        });
        it('should set submittedAt timestamp', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const beforeSubmit = new Date();
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            const afterSubmit = new Date();
            expect(result.submittedAt).toBeDefined();
            expect(result.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
            expect(result.submittedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
        });
        it('should persist changes to repository', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            await useCase.execute(input);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledTimes(1);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
        it('should return correct DTO with status and submittedAt', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('submittedAt');
            expect(typeof result.id).toBe('string');
            expect(typeof result.status).toBe('string');
            expect(result.submittedAt).toBeInstanceOf(Date);
        });
    });
    describe('validation: cycle existence', () => {
        it('should throw ReviewNotFoundException if cycle does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow(`Review cycle with ID ${cycleId.value} not found`);
        });
        it('should not proceed to find review if cycle does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('validation: deadline check', () => {
        it('should throw Error if self-review deadline has passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed');
        });
        it('should not proceed to find review if deadline has passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should check deadline using cycle.hasDeadlinePassed method', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const hasDeadlinePassedSpy = jest.spyOn(cycle, 'hasDeadlinePassed');
            hasDeadlinePassedSpy.mockReturnValue(true);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(hasDeadlinePassedSpy).toHaveBeenCalledWith('selfReview');
        });
        it('should allow submission when deadline has not passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalled();
        });
    });
    describe('validation: review existence', () => {
        it('should throw ReviewNotFoundException if self-review not found', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow('Self-review not found for this user and cycle');
        });
        it('should not proceed to submit if review is not found', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockSelfReviewRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('validation: narrative completeness', () => {
        it('should throw Error if narrative is empty', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: narrative_vo_1.Narrative.create(''),
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            await expect(useCase.execute(input)).rejects.toThrow('Cannot submit incomplete self-review. Narrative is required.');
        });
        it('should throw Error if narrative is only whitespace', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: narrative_vo_1.Narrative.create('   \n\t  '),
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            await expect(useCase.execute(input)).rejects.toThrow('Cannot submit incomplete self-review. Narrative is required.');
        });
        it('should not proceed to submit if narrative is empty', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: narrative_vo_1.Narrative.create(''),
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockSelfReviewRepository.save).not.toHaveBeenCalled();
        });
        it('should allow submission with valid non-empty narrative', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: narrative_vo_1.Narrative.create('This is a comprehensive self-review narrative'),
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockSelfReviewRepository.save).toHaveBeenCalled();
        });
    });
    describe('edge cases: already submitted reviews', () => {
        it('should handle already submitted review (entity should throw SelfReviewAlreadySubmittedException)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            review.submit();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            await expect(useCase.execute(input)).rejects.toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
        it('should not save when review is already submitted', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            review.submit();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockSelfReviewRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('integration: full workflow scenarios', () => {
        it('should complete full submission workflow successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: narrative_vo_1.Narrative.create('Final comprehensive self-review narrative'),
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result = await useCase.execute(input);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
            expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(userId, cycleId);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
            expect(result.status).toBe('SUBMITTED');
            expect(result.submittedAt).toBeDefined();
        });
        it('should handle multiple submission attempts with proper error handling', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({
                cycleId,
                userId,
            });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const submittedReview = createValidSelfReview({
                id: review.id,
                cycleId,
                userId,
                scores: review.scores,
                narrative: review.narrative,
            });
            submittedReview.submit();
            mockSelfReviewRepository.save.mockResolvedValue(submittedReview);
            const result1 = await useCase.execute(input);
            expect(result1.status).toBe('SUBMITTED');
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(submittedReview);
            await expect(useCase.execute(input)).rejects.toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
    });
    describe('error precedence', () => {
        it('should validate cycle before checking review', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should check deadline before retrieving review', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed');
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should validate review existence before checking narrative', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const userId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                userId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockSelfReviewRepository.save).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=submit-self-review.use-case.spec.js.map