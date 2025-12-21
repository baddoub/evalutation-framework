"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_my_self_review_use_case_1 = require("./get-my-self-review.use-case");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
describe('GetMySelfReviewUseCase', () => {
    let useCase;
    let selfReviewRepository;
    let cycleRepository;
    const createValidInput = () => ({
        userId: user_id_vo_1.UserId.generate(),
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
    });
    const createValidReviewCycle = (cycleId) => {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: new Date('2024-01-31'),
            peerFeedback: new Date('2024-02-28'),
            managerEvaluation: new Date('2024-03-31'),
            calibration: new Date('2024-04-30'),
            feedbackDelivery: new Date('2024-05-31'),
        });
        return review_cycle_entity_1.ReviewCycle.create({
            id: cycleId,
            year: 2024,
            startDate: new Date('2024-01-01'),
            name: 'Annual Review 2024',
            deadlines,
        });
    };
    const createValidSelfReview = (cycleId, userId) => {
        return self_review_entity_1.SelfReview.create({
            cycleId,
            userId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            narrative: narrative_vo_1.Narrative.create('This is my self-review narrative'),
        });
    };
    beforeEach(() => {
        selfReviewRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        cycleRepository = {
            findById: jest.fn(),
            findByYear: jest.fn(),
            findActive: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new get_my_self_review_use_case_1.GetMySelfReviewUseCase(selfReviewRepository, cycleRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve existing self-review when found', () => {
            it('should return existing review with all data populated', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const existingReview = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(existingReview);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.id).toBe(existingReview.id.value);
                expect(result.cycleId).toBe(input.cycleId.value);
                expect(result.userId).toBe(input.userId.value);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.scores).toEqual({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                expect(result.narrative).toBe('This is my self-review narrative');
                expect(result.wordCount).toBeDefined();
            });
            it('should not call save when review already exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const existingReview = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(existingReview);
                await useCase.execute(input);
                expect(selfReviewRepository.save).not.toHaveBeenCalled();
            });
            it('should call findByUserAndCycle with correct parameters', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const existingReview = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(existingReview);
                await useCase.execute(input);
                expect(selfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId);
                expect(selfReviewRepository.findByUserAndCycle).toHaveBeenCalledTimes(1);
            });
            it('should return review with submitted status if review was submitted', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const submittedReview = createValidSelfReview(input.cycleId, input.userId);
                submittedReview.submit();
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(submittedReview);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.submittedAt).toBeDefined();
            });
        });
        describe('CRITICAL: Should create new draft review when not found', () => {
            it('should create and save new review with zero scores and empty narrative', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                const result = await useCase.execute(input);
                expect(selfReviewRepository.save).toHaveBeenCalledTimes(1);
                expect(result.scores).toEqual({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                expect(result.narrative).toBe('');
            });
            it('should create new review in DRAFT status', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.submittedAt).toBeUndefined();
            });
            it('should save the newly created review', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                await useCase.execute(input);
                expect(selfReviewRepository.save).toHaveBeenCalledWith(expect.any(self_review_entity_1.SelfReview));
                expect(selfReviewRepository.save).toHaveBeenCalledTimes(1);
            });
            it('should return saved review data', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                const result = await useCase.execute(input);
                expect(result.id).toBe(newReview.id.value);
                expect(result.cycleId).toBe(input.cycleId.value);
                expect(result.userId).toBe(input.userId.value);
            });
        });
        describe('CRITICAL: Should validate cycle exists', () => {
            it('should throw ReviewNotFoundException if cycle does not exist', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            });
            it('should throw ReviewNotFoundException with correct message including cycle ID', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(`Review cycle with ID ${input.cycleId.value} not found`);
            });
            it('should call cycleRepository.findById with correct cycle ID', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(cycleRepository.findById).toHaveBeenCalledTimes(1);
            });
            it('should not proceed to find/create review if cycle validation fails', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(selfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
            });
        });
        describe('IMPORTANT: Should return correct DTO structure with all fields', () => {
            it('should return output with all required fields', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('cycleId');
                expect(result).toHaveProperty('userId');
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('scores');
                expect(result).toHaveProperty('narrative');
                expect(result).toHaveProperty('wordCount');
                expect(result).toHaveProperty('createdAt');
                expect(result).toHaveProperty('updatedAt');
            });
            it('should return DTO with correct structure for scores', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.scores).toHaveProperty('projectImpact');
                expect(result.scores).toHaveProperty('direction');
                expect(result.scores).toHaveProperty('engineeringExcellence');
                expect(result.scores).toHaveProperty('operationalOwnership');
                expect(result.scores).toHaveProperty('peopleImpact');
                expect(typeof result.scores.projectImpact).toBe('number');
                expect(typeof result.scores.direction).toBe('number');
                expect(typeof result.scores.engineeringExcellence).toBe('number');
                expect(typeof result.scores.operationalOwnership).toBe('number');
                expect(typeof result.scores.peopleImpact).toBe('number');
            });
            it('should return DTO as GetMySelfReviewOutput interface', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(typeof result.id).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(typeof result.userId).toBe('string');
                expect(typeof result.status).toBe('string');
                expect(typeof result.narrative).toBe('string');
                expect(typeof result.wordCount).toBe('number');
                expect(result.createdAt instanceof Date).toBe(true);
                expect(result.updatedAt instanceof Date).toBe(true);
            });
            it('should include submittedAt when review is submitted', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                review.submit();
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.submittedAt).toBeDefined();
                expect(result.submittedAt instanceof Date).toBe(true);
            });
            it('should not include submittedAt when review is in draft', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.submittedAt).toBeUndefined();
            });
            it('should return string IDs (not value objects)', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(typeof result.id).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(typeof result.userId).toBe('string');
                expect(typeof result.status).toBe('string');
            });
        });
        describe('IMPORTANT: Should handle repository errors gracefully', () => {
            it('should throw error if cycle repository fails', async () => {
                const input = createValidInput();
                const error = new Error('Database connection failed');
                cycleRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
            });
            it('should throw error if self-review repository find fails', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const error = new Error('Query failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Query failed');
            });
            it('should throw error if save operation fails', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const error = new Error('Save failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Save failed');
            });
            it('should propagate cycle repository errors without modification', async () => {
                const input = createValidInput();
                const customError = new review_not_found_exception_1.ReviewNotFoundException('Custom cycle error');
                cycleRepository.findById.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
            it('should propagate self-review repository errors without modification', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const customError = new Error('Custom repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
        });
        describe('EDGE: Should handle null/undefined inputs', () => {
            it('should work with valid userId', async () => {
                const userId = user_id_vo_1.UserId.generate();
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const input = { userId, cycleId };
                const cycle = createValidReviewCycle(cycleId);
                const review = createValidSelfReview(cycleId, userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.userId).toBe(userId.value);
            });
            it('should work with valid cycleId', async () => {
                const userId = user_id_vo_1.UserId.generate();
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const input = { userId, cycleId };
                const cycle = createValidReviewCycle(cycleId);
                const review = createValidSelfReview(cycleId, userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.cycleId).toBe(cycleId.value);
            });
            it('should handle empty narrative text', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 1,
                        direction: 1,
                        engineeringExcellence: 1,
                        operationalOwnership: 1,
                        peopleImpact: 1,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.narrative).toBe('');
                expect(result.wordCount).toBe(0);
            });
            it('should handle review with only whitespace narrative', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 1,
                        direction: 1,
                        engineeringExcellence: 1,
                        operationalOwnership: 1,
                        peopleImpact: 1,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText('   '),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.narrative).toBeDefined();
                expect(typeof result.narrative).toBe('string');
            });
            it('should handle very long narrative text', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const longNarrative = 'word '.repeat(1000);
                const review = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 2,
                        engineeringExcellence: 2,
                        operationalOwnership: 2,
                        peopleImpact: 2,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(longNarrative),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(result.narrative).toBeDefined();
                expect(typeof result.narrative).toBe('string');
                expect(result.wordCount).toBeGreaterThan(0);
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: find existing, update, retrieve', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const review = createValidSelfReview(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
                const result = await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(selfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId);
                expect(selfReviewRepository.save).not.toHaveBeenCalled();
                expect(result.id).toBeDefined();
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
            });
            it('should complete full workflow: create new draft if not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                const result = await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(selfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId);
                expect(selfReviewRepository.save).toHaveBeenCalledWith(expect.any(self_review_entity_1.SelfReview));
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.scores.projectImpact).toBe(0);
            });
            it('should maintain data consistency between created and returned review', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const newReview = self_review_entity_1.SelfReview.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: narrative_vo_1.Narrative.fromText(''),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                selfReviewRepository.save.mockResolvedValue(newReview);
                const result = await useCase.execute(input);
                const savedReview = selfReviewRepository.save.mock.calls[0][0];
                expect(result.cycleId).toBe(savedReview.cycleId.value);
                expect(result.userId).toBe(savedReview.userId.value);
                expect(result.status).toBe(savedReview.status.value);
            });
        });
    });
});
//# sourceMappingURL=get-my-self-review.use-case.spec.js.map