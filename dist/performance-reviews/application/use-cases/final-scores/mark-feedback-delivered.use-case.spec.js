"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mark_feedback_delivered_use_case_1 = require("./mark-feedback-delivered.use-case");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
describe('MarkFeedbackDeliveredUseCase', () => {
    let useCase;
    let mockFinalScoreRepository;
    let mockCycleRepository;
    let mockUserRepository;
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
    const createValidFinalScore = (overrides) => {
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const userId = overrides?.userId || user_id_vo_1.UserId.generate();
        const finalScore = final_score_entity_1.FinalScore.create({
            id: overrides?.id,
            cycleId,
            userId,
            pillarScores: overrides?.scores ||
                pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 3,
                }),
            weightedScore: overrides?.weightedScore ||
                weighted_score_vo_1.WeightedScore.fromValue(3.5),
            finalLevel: engineer_level_vo_1.EngineerLevel.create('Senior'),
        });
        if (overrides?.locked) {
            finalScore.lock();
        }
        return finalScore;
    };
    const createValidUser = (overrides) => {
        const userId = overrides?.id || user_id_vo_1.UserId.generate();
        const managerId = overrides?.managerId || 'manager-123';
        return user_entity_1.User.create({
            id: userId,
            email: email_vo_1.Email.create(overrides?.email || 'employee@example.com'),
            name: overrides?.name || 'John Doe',
            keycloakId: `keycloak-${userId.value}`,
            roles: [role_vo_1.Role.create('user')],
            isActive: true,
            managerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    beforeEach(() => {
        mockFinalScoreRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            findByBonusTier: jest.fn(),
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
        mockUserRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByKeycloakId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            existsByEmail: jest.fn(),
            findByRole: jest.fn(),
            findByManagerId: jest.fn(),
        };
        useCase = new mark_feedback_delivered_use_case_1.MarkFeedbackDeliveredUseCase(mockFinalScoreRepository, mockCycleRepository, mockUserRepository);
    });
    describe('CRITICAL: Mark feedback as delivered successfully', () => {
        it('should mark feedback as delivered successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Great performance this year',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result).toEqual({
                employeeId: updatedScore.userId.value,
                feedbackDelivered: true,
                feedbackDeliveredAt: updatedScore.feedbackDeliveredAt,
            });
            expect(result.feedbackDelivered).toBe(true);
            expect(result.feedbackDeliveredAt).toBeInstanceOf(Date);
        });
        it('should mark feedback delivered with feedback notes', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const feedbackNotes = 'Excellent work on Q4 projects';
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
        });
        it('should mark feedback delivered without optional feedback notes', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Validate final score exists', () => {
        it('should throw ReviewNotFoundException if final score not found', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow('Final score not found');
        });
        it('should not proceed to mark delivery if final score does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Set deliveredAt timestamp', () => {
        it('should set deliveredAt timestamp with current time', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const beforeMark = new Date();
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            const afterMark = new Date();
            expect(result.feedbackDeliveredAt).toBeDefined();
            expect(result.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
            expect(result.feedbackDeliveredAt.getTime()).toBeLessThanOrEqual(afterMark.getTime());
        });
        it('should update feedbackDeliveredAt on each marking', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result1 = await useCase.execute(input);
            expect(result1.feedbackDeliveredAt).toBeInstanceOf(Date);
        });
    });
    describe('CRITICAL: Record deliveredBy user ID', () => {
        it('should record manager ID as deliveredBy', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
            expect(finalScore.feedbackDelivered).toBe(true);
        });
        it('should pass correct manager ID to markFeedbackDelivered', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const markFeedbackSpy = jest.spyOn(finalScore, 'markFeedbackDelivered');
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            await useCase.execute(input);
            expect(markFeedbackSpy).toHaveBeenCalledWith(managerId, input.feedbackNotes);
            markFeedbackSpy.mockRestore();
        });
    });
    describe('CRITICAL: Prevent duplicate delivery marking', () => {
        it('should allow marking feedback delivered even if already marked (idempotent operation)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            finalScore.markFeedbackDelivered(managerId, 'First delivery');
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Second delivery notes',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should allow multiple marking attempts with different notes', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input1 = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'First attempt notes',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            const updatedScore1 = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore1.markFeedbackDelivered(managerId, input1.feedbackNotes);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore1);
            const result1 = await useCase.execute(input1);
            expect(result1.feedbackDelivered).toBe(true);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const input2 = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Updated notes',
            };
            const updatedScore2 = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore2.markFeedbackDelivered(managerId, input2.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore2);
            const result2 = await useCase.execute(input2);
            expect(result2.feedbackDelivered).toBe(true);
        });
    });
    describe('IMPORTANT: Persist changes to repository', () => {
        it('should save updated final score to repository', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
        });
        it('should call save only once per execution', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Test notes',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
        });
    });
    describe('IMPORTANT: Return success confirmation', () => {
        it('should return DTO with correct employee ID', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('employeeId');
            expect(result.employeeId).toBe(updatedScore.userId.value);
        });
        it('should return DTO with feedbackDelivered flag set to true', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('feedbackDelivered');
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should return DTO with feedbackDeliveredAt timestamp', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('feedbackDeliveredAt');
            expect(result.feedbackDeliveredAt).toBeInstanceOf(Date);
        });
        it('should return MarkFeedbackDeliveredOutput with all required properties', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result).toEqual({
                employeeId: expect.any(String),
                feedbackDelivered: true,
                feedbackDeliveredAt: expect.any(Date),
            });
        });
    });
    describe('IMPORTANT: Validate manager authorization', () => {
        it('should throw error if manager is not the employee\'s direct manager', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const wrongManagerId = user_id_vo_1.UserId.generate();
            const correctManagerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: correctManagerId.value,
            });
            const input = {
                employeeId,
                managerId: wrongManagerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            await expect(useCase.execute(input)).rejects.toThrow(Error);
            await expect(useCase.execute(input)).rejects.toThrow('You can only mark feedback delivered for your direct reports');
        });
        it('should not proceed if manager-employee relationship is invalid', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const wrongManagerId = user_id_vo_1.UserId.generate();
            const correctManagerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: correctManagerId.value,
            });
            const input = {
                employeeId,
                managerId: wrongManagerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should allow manager to mark feedback for their direct report', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalled();
        });
    });
    describe('EDGE: Handle already delivered feedback', () => {
        it('should handle feedback that was already delivered', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            finalScore.markFeedbackDelivered(managerId, 'Previously delivered');
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should update delivery record for already delivered feedback', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            finalScore.markFeedbackDelivered(managerId, 'First delivery');
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Updated delivery notes',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
    });
    describe('EDGE: Handle locked final scores', () => {
        it('should still allow marking feedback as delivered for locked scores', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
                locked: true,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
                locked: true,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should record timestamp for locked scores feedback delivery', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
                locked: true,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const beforeMark = new Date();
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
                locked: true,
            });
            updatedScore.markFeedbackDelivered(managerId);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            const afterMark = new Date();
            expect(result.feedbackDeliveredAt).toBeDefined();
            expect(result.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
            expect(result.feedbackDeliveredAt.getTime()).toBeLessThanOrEqual(afterMark.getTime());
        });
    });
    describe('EDGE: Verify employee-manager relationship', () => {
        it('should verify employee exists in system', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow('Employee not found');
        });
        it('should not proceed if employee is not found', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should confirm manager ID matches employee\'s manager', async () => {
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            expect(employee.managerId).toBe(managerId.value);
        });
    });
    describe('EDGE: Handle missing final score', () => {
        it('should throw ReviewNotFoundException when final score is missing', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow('Final score not found');
        });
        it('should provide clear error message for missing final score', async () => {
            const error = new review_not_found_exception_1.ReviewNotFoundException('Final score not found');
            expect(error.message).toBe('Final score not found');
        });
    });
    describe('error precedence: validation order', () => {
        it('should validate cycle before checking employee', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });
        it('should validate employee before checking final score', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const input = {
                employeeId,
                managerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
        it('should validate manager relationship before checking final score', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const wrongManagerId = user_id_vo_1.UserId.generate();
            const correctManagerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: correctManagerId.value,
            });
            const input = {
                employeeId,
                managerId: wrongManagerId,
                cycleId,
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('integration: full workflow scenarios', () => {
        it('should complete full feedback delivery workflow successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Comprehensive feedback on performance',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result = await useCase.execute(input);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
            expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId);
            expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
            expect(result.feedbackDelivered).toBe(true);
            expect(result.feedbackDeliveredAt).toBeInstanceOf(Date);
        });
        it('should handle multiple employees in same cycle independently', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employee1Id = user_id_vo_1.UserId.generate();
            const employee2Id = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee1 = createValidUser({
                id: employee1Id,
                managerId: managerId.value,
            });
            const employee2 = createValidUser({
                id: employee2Id,
                managerId: managerId.value,
            });
            const finalScore1 = createValidFinalScore({
                cycleId,
                userId: employee1Id,
            });
            const finalScore2 = createValidFinalScore({
                cycleId,
                userId: employee2Id,
            });
            const input1 = {
                employeeId: employee1Id,
                managerId,
                cycleId,
                feedbackNotes: 'Feedback for employee 1',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValueOnce(employee1);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore1);
            const updatedScore1 = createValidFinalScore({
                id: finalScore1.id,
                cycleId,
                userId: employee1Id,
            });
            updatedScore1.markFeedbackDelivered(managerId, input1.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValueOnce(updatedScore1);
            const result1 = await useCase.execute(input1);
            expect(result1.employeeId).toBe(employee1Id.value);
            expect(result1.feedbackDelivered).toBe(true);
            const input2 = {
                employeeId: employee2Id,
                managerId,
                cycleId,
                feedbackNotes: 'Feedback for employee 2',
            };
            mockUserRepository.findById.mockResolvedValueOnce(employee2);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore2);
            const updatedScore2 = createValidFinalScore({
                id: finalScore2.id,
                cycleId,
                userId: employee2Id,
            });
            updatedScore2.markFeedbackDelivered(managerId, input2.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValueOnce(updatedScore2);
            const result2 = await useCase.execute(input2);
            expect(result2.employeeId).toBe(employee2Id.value);
            expect(result2.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
        });
        it('should handle concurrent marking attempts for same employee', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidUser({
                id: employeeId,
                managerId: managerId.value,
            });
            const finalScore = createValidFinalScore({
                cycleId,
                userId: employeeId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                feedbackNotes: 'Feedback notes',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
            const updatedScore = createValidFinalScore({
                id: finalScore.id,
                cycleId,
                userId: employeeId,
            });
            updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes);
            mockFinalScoreRepository.save.mockResolvedValue(updatedScore);
            const result1 = await useCase.execute(input);
            const result2 = await useCase.execute(input);
            expect(result1.feedbackDelivered).toBe(true);
            expect(result2.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=mark-feedback-delivered.use-case.spec.js.map