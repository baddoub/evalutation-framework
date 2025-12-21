"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_self_review_use_case_1 = require("./update-self-review.use-case");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const self_review_already_submitted_exception_1 = require("../../../domain/exceptions/self-review-already-submitted.exception");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
describe('UpdateSelfReviewUseCase', () => {
    let useCase;
    let mockSelfReviewRepository;
    let mockCycleRepository;
    const createValidReviewCycle = () => {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: new Date(Date.now() + 86400000),
            peerFeedback: new Date(Date.now() + 172800000),
            managerEvaluation: new Date(Date.now() + 259200000),
            calibration: new Date(Date.now() + 345600000),
            feedbackDelivery: new Date(Date.now() + 432000000),
        });
        const cycle = review_cycle_entity_1.ReviewCycle.create({
            name: 'Q4 2024 Review Cycle',
            year: 2024,
            deadlines,
        });
        return cycle;
    };
    const createValidSelfReview = (overrides) => {
        const cycleId = overrides?.cycleId ?? review_cycle_id_vo_1.ReviewCycleId.generate();
        const userId = overrides?.userId ?? user_id_vo_1.UserId.generate();
        const scores = overrides?.scores ?? pillar_scores_vo_1.PillarScores.create({
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
        });
        const narrative = overrides?.narrative ?? narrative_vo_1.Narrative.create('This is my self-review narrative');
        return self_review_entity_1.SelfReview.create({
            cycleId,
            userId,
            scores,
            narrative,
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
        useCase = new update_self_review_use_case_1.UpdateSelfReviewUseCase(mockSelfReviewRepository, mockCycleRepository);
    });
    describe('CRITICAL: Cycle Validation', () => {
        it('should throw ReviewNotFoundException when cycle does not exist', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            mockCycleRepository.findById.mockResolvedValue(null);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
        });
        it('should throw error when self-review deadline has passed', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const passedDeadline = new Date(Date.now() - 86400000);
            const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
                selfReview: passedDeadline,
                peerFeedback: new Date(Date.now() + 172800000),
                managerEvaluation: new Date(Date.now() + 259200000),
                calibration: new Date(Date.now() + 345600000),
                feedbackDelivery: new Date(Date.now() + 432000000),
            });
            const cycle = review_cycle_entity_1.ReviewCycle.create({
                name: 'Q4 2024 Review Cycle',
                year: 2024,
                deadlines,
            });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed');
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
        });
    });
    describe('CRITICAL: Review Existence Validation', () => {
        it('should throw ReviewNotFoundException when self-review not found for user and cycle', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(userId, cycleId);
        });
    });
    describe('CRITICAL: Updating Scores', () => {
        it('should update scores when provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
            };
            void await useCase.execute(input);
            expect(review.scores.projectImpact.value).toBe(newScoresData.projectImpact);
            expect(review.scores.direction.value).toBe(newScoresData.direction);
            expect(review.scores.engineeringExcellence.value).toBe(newScoresData.engineeringExcellence);
            expect(review.scores.operationalOwnership.value).toBe(newScoresData.operationalOwnership);
            expect(review.scores.peopleImpact.value).toBe(newScoresData.peopleImpact);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
        it('should call updateScores() on entity when scores provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            const updateScoresSpy = jest.spyOn(review, 'updateScores');
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
            };
            await useCase.execute(input);
            expect(updateScoresSpy).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Updating Narrative', () => {
        it('should update narrative when provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newNarrative = narrative_vo_1.Narrative.create('This is my updated narrative text');
            const input = {
                userId,
                cycleId,
                narrative: newNarrative,
            };
            await useCase.execute(input);
            expect(review.narrative).toBe(newNarrative);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
        it('should call updateNarrative() on entity when narrative provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            const updateNarrativeSpy = jest.spyOn(review, 'updateNarrative');
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newNarrative = narrative_vo_1.Narrative.create('This is my updated narrative text');
            const input = {
                userId,
                cycleId,
                narrative: newNarrative,
            };
            await useCase.execute(input);
            expect(updateNarrativeSpy).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Updating Both Scores and Narrative', () => {
        it('should update both scores and narrative when both provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const newNarrative = narrative_vo_1.Narrative.create('Updated narrative after both changes');
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
                narrative: newNarrative,
            };
            await useCase.execute(input);
            expect(review.scores.projectImpact.value).toBe(newScoresData.projectImpact);
            expect(review.narrative).toBe(newNarrative);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
        it('should call both updateScores() and updateNarrative() when both provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            const updateScoresSpy = jest.spyOn(review, 'updateScores');
            const updateNarrativeSpy = jest.spyOn(review, 'updateNarrative');
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const newNarrative = narrative_vo_1.Narrative.create('Updated narrative after both changes');
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
                narrative: newNarrative,
            };
            await useCase.execute(input);
            expect(updateScoresSpy).toHaveBeenCalled();
            expect(updateNarrativeSpy).toHaveBeenCalled();
        });
    });
    describe('IMPORTANT: Repository Persistence', () => {
        it('should persist changes to repository via save', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
            };
            await useCase.execute(input);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledTimes(1);
        });
        it('should call save with the modified review entity', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newNarrative = narrative_vo_1.Narrative.create('Persisted narrative');
            const input = {
                userId,
                cycleId,
                narrative: newNarrative,
            };
            await useCase.execute(input);
            const savedEntity = mockSelfReviewRepository.save.mock.calls[0][0];
            expect(savedEntity.narrative).toBe(newNarrative);
        });
    });
    describe('IMPORTANT: Return Value and DTO Structure', () => {
        it('should return updated DTO with correct values', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
            };
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('userId');
            expect(result).toHaveProperty('cycleId');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('scores');
            expect(result).toHaveProperty('narrative');
            expect(result).toHaveProperty('wordCount');
            expect(result).toHaveProperty('updatedAt');
        });
        it('should return correct DTO values matching entity state', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            const result = await useCase.execute(input);
            expect(result.id).toBe(review.id.value);
            expect(result.userId).toBe(review.userId.value);
            expect(result.cycleId).toBe(review.cycleId.value);
            expect(result.status).toBe(review.status.value);
            expect(result.scores.projectImpact).toBe(4);
            expect(result.scores.direction).toBe(3);
            expect(result.scores.engineeringExcellence).toBe(4);
            expect(result.scores.operationalOwnership).toBe(4);
            expect(result.scores.peopleImpact).toBe(3);
        });
        it('should include updatedAt timestamp in response', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const beforeExecution = new Date();
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            const result = await useCase.execute(input);
            expect(result.updatedAt).toBeDefined();
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
        });
        it('should return narrative with correct word count', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
            };
            const result = await useCase.execute(input);
            expect(result.narrative).toBe(review.narrative.text);
            expect(result.wordCount).toBe(review.narrative.wordCount);
        });
    });
    describe('EDGE: Updating Already Submitted Review', () => {
        it('should throw exception when trying to update scores on submitted review', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            review.submit();
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
        it('should throw exception when trying to update narrative on submitted review', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            review.submit();
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const newNarrative = narrative_vo_1.Narrative.create('Trying to update submitted review');
            const input = {
                userId,
                cycleId,
                narrative: newNarrative,
            };
            await expect(useCase.execute(input)).rejects.toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
        it('should throw exception when trying to update both on submitted review', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            review.submit();
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: narrative_vo_1.Narrative.create('Updated narrative'),
            };
            await expect(useCase.execute(input)).rejects.toThrow(self_review_already_submitted_exception_1.SelfReviewAlreadySubmittedException);
        });
    });
    describe('EDGE: Partial Updates', () => {
        it('should handle updating only scores without narrative', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const originalNarrative = narrative_vo_1.Narrative.create('Original narrative');
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: originalNarrative,
            });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                userId,
                cycleId,
                scores: newScoresData,
            };
            const result = await useCase.execute(input);
            expect(result.scores.projectImpact).toBe(newScoresData.projectImpact);
            expect(result.narrative).toBe(originalNarrative.text);
        });
        it('should handle updating only narrative without scores', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const originalScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const review = createValidSelfReview({
                cycleId,
                userId,
                scores: originalScores,
            });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const newNarrative = narrative_vo_1.Narrative.create('Only narrative is updated');
            const input = {
                userId,
                cycleId,
                narrative: newNarrative,
            };
            const result = await useCase.execute(input);
            expect(result.scores.projectImpact).toBe(originalScores.projectImpact.value);
            expect(result.scores.direction).toBe(originalScores.direction.value);
            expect(result.narrative).toBe(newNarrative.text);
        });
        it('should maintain original values when partial update provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const originalNarrative = narrative_vo_1.Narrative.create('Original narrative text');
            const review = createValidSelfReview({
                cycleId,
                userId,
                narrative: originalNarrative,
            });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(review.narrative).toBe(originalNarrative);
        });
    });
    describe('EDGE: Empty Update', () => {
        it('should handle empty update with no scores or narrative provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
        it('should not call updateScores when scores not provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            const updateScoresSpy = jest.spyOn(review, 'updateScores');
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                narrative: narrative_vo_1.Narrative.create('Only narrative update'),
            };
            await useCase.execute(input);
            expect(updateScoresSpy).not.toHaveBeenCalled();
        });
        it('should not call updateNarrative when narrative not provided', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            const updateNarrativeSpy = jest.spyOn(review, 'updateNarrative');
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            void await useCase.execute(input);
            expect(updateNarrativeSpy).not.toHaveBeenCalled();
        });
        it('should still persist empty update to repository', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
            };
            await useCase.execute(input);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
        });
    });
    describe('Integration: Full Workflow', () => {
        it('should execute complete update workflow with all validations', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: narrative_vo_1.Narrative.create('Comprehensive update with all validations'),
            };
            const result = await useCase.execute(input);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
            expect(mockSelfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(userId, cycleId);
            expect(mockSelfReviewRepository.save).toHaveBeenCalledWith(review);
            expect(result).toBeDefined();
            expect(result.scores.projectImpact).toBe(4);
        });
        it('should validate cycle before checking review existence', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            mockCycleRepository.findById.mockResolvedValue(null);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should check deadline before finding review', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const passedDeadline = new Date(Date.now() - 86400000);
            const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
                selfReview: passedDeadline,
                peerFeedback: new Date(Date.now() + 172800000),
                managerEvaluation: new Date(Date.now() + 259200000),
                calibration: new Date(Date.now() + 345600000),
                feedbackDelivery: new Date(Date.now() + 432000000),
            });
            const cycle = review_cycle_entity_1.ReviewCycle.create({
                name: 'Q4 2024 Review Cycle',
                year: 2024,
                deadlines,
            });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow('Self-review deadline has passed');
            expect(mockSelfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('Boundary Conditions', () => {
        it('should handle minimum valid scores', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                },
            };
            const result = await useCase.execute(input);
            expect(result.scores.projectImpact).toBe(0);
            expect(mockSelfReviewRepository.save).toHaveBeenCalled();
        });
        it('should handle maximum valid scores', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycle = createValidReviewCycle();
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                },
            };
            const result = await useCase.execute(input);
            expect(result.scores.projectImpact).toBe(4);
            expect(result.scores.direction).toBe(4);
        });
        it('should handle deadline exactly at current time', async () => {
            const userId = user_id_vo_1.UserId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const now = new Date();
            const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
                selfReview: now,
                peerFeedback: new Date(now.getTime() + 172800000),
                managerEvaluation: new Date(now.getTime() + 259200000),
                calibration: new Date(now.getTime() + 345600000),
                feedbackDelivery: new Date(now.getTime() + 432000000),
            });
            const cycle = review_cycle_entity_1.ReviewCycle.create({
                name: 'Q4 2024 Review Cycle',
                year: 2024,
                deadlines,
            });
            const review = createValidSelfReview({ cycleId, userId });
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockSelfReviewRepository.findByUserAndCycle.mockResolvedValue(review);
            mockSelfReviewRepository.save.mockResolvedValue(review);
            const input = {
                userId,
                cycleId,
                scores: {
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 3,
                    operationalOwnership: 3,
                    peopleImpact: 3,
                },
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
        });
    });
});
//# sourceMappingURL=update-self-review.use-case.spec.js.map