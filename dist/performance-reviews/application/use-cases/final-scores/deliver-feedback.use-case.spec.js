"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deliver_feedback_use_case_1 = require("./deliver-feedback.use-case");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
describe('DeliverFeedbackUseCase', () => {
    let useCase;
    let mockFinalScoreRepository;
    const createValidFinalScore = (overrides) => {
        const id = overrides?.id || final_score_entity_1.FinalScoreId.generate();
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const userId = overrides?.userId || user_id_vo_1.UserId.generate();
        const finalScore = final_score_entity_1.FinalScore.create({
            id,
            cycleId,
            userId,
            pillarScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.4),
            finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
        });
        if (overrides?.locked) {
            finalScore.lock();
        }
        return finalScore;
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
        useCase = new deliver_feedback_use_case_1.DeliverFeedbackUseCase(mockFinalScoreRepository);
    });
    describe('CRITICAL: Should deliver feedback to employee successfully', () => {
        it('should deliver feedback to employee with valid inputs', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Good performance overall',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockFinalScoreRepository.findById).toHaveBeenCalledWith(expect.objectContaining({ value: finalScoreId.value }));
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should complete delivery workflow without errors', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should return DTO with complete delivery information', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                cycleId,
                userId: employeeId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Excellent work',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('employeeId');
            expect(result).toHaveProperty('cycleId');
            expect(result).toHaveProperty('feedbackDelivered');
            expect(result).toHaveProperty('feedbackNotes');
            expect(result).toHaveProperty('deliveredAt');
            expect(result).toHaveProperty('deliveredBy');
            expect(result).toHaveProperty('weightedScore');
            expect(result).toHaveProperty('percentageScore');
            expect(result).toHaveProperty('bonusTier');
        });
    });
    describe('CRITICAL: Should validate final score exists', () => {
        it('should throw error if final score not found', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow('Final score not found');
        });
        it('should throw error before attempting to mark feedback as delivered', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
        it('should not persist if final score does not exist', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Should validate final score is not locked', () => {
        it('should throw error if final score is locked', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const lockedFinalScore = createValidFinalScore({ id: finalScoreId, locked: true });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(lockedFinalScore);
            await expect(useCase.execute(input)).rejects.toThrow('Cannot deliver feedback on a locked final score');
        });
        it('should prevent delivery when score is locked', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const lockedFinalScore = createValidFinalScore({ id: finalScoreId, locked: true });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(lockedFinalScore);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
        it('should allow delivery when score is unlocked', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const unlockedFinalScore = createValidFinalScore({ id: finalScoreId, locked: false });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(unlockedFinalScore);
            mockFinalScoreRepository.save.mockResolvedValue(unlockedFinalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Should mark feedback as delivered', () => {
        it('should mark feedback as delivered on entity', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Great performance',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            const markFeedbackDeliveredSpy = jest.spyOn(finalScore, 'markFeedbackDelivered');
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(input);
            expect(markFeedbackDeliveredSpy).toHaveBeenCalledWith(expect.objectContaining({ value: deliveredByUserId.value }), 'Great performance');
        });
        it('should set feedbackDelivered flag to true', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should include feedback notes when provided', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const feedbackNotes = 'Excellent technical contribution and leadership';
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.feedbackNotes).toBe(feedbackNotes);
        });
    });
    describe('CRITICAL: Should set deliveredAt timestamp', () => {
        it('should set deliveredAt timestamp when delivering feedback', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            const beforeDelivery = new Date();
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            const afterDelivery = new Date();
            expect(result.deliveredAt).toBeDefined();
            expect(result.deliveredAt).toBeInstanceOf(Date);
            expect(result.deliveredAt.getTime()).toBeGreaterThanOrEqual(beforeDelivery.getTime());
            expect(result.deliveredAt.getTime()).toBeLessThanOrEqual(afterDelivery.getTime());
        });
        it('should record timestamp with precision', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.deliveredAt.getMilliseconds()).toBeDefined();
            expect(typeof result.deliveredAt.getTime()).toBe('number');
        });
    });
    describe('CRITICAL: Should record who delivered the feedback (deliveredBy)', () => {
        it('should record deliveredBy user ID', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.deliveredBy).toBe(deliveredByUserId.value);
        });
        it('should track different managers delivering feedback', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const manager1UserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: manager1UserId.value,
                feedbackNotes: 'Delivered by manager 1',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.deliveredBy).toEqual(manager1UserId.value);
            expect(result.feedbackNotes).toBe('Delivered by manager 1');
        });
        it('should preserve deliveredBy value in output', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.deliveredBy).toBe(input.deliveredBy);
        });
    });
    describe('IMPORTANT: Should persist delivery status', () => {
        it('should save final score to repository after delivering feedback', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
        });
        it('should persist updated entity state', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Performance notes',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should ensure repository save is called exactly once', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(input);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
        });
    });
    describe('IMPORTANT: Should return updated DTO', () => {
        it('should return DeliverFeedbackOutput with all required fields', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                cycleId,
                userId: employeeId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.id).toBe(finalScoreId.value);
            expect(result.employeeId).toBe(employeeId.value);
            expect(result.cycleId).toBe(cycleId.value);
            expect(result.feedbackDelivered).toBe(true);
            expect(result.deliveredAt).toBeInstanceOf(Date);
            expect(result.deliveredBy).toBe(deliveredByUserId.value);
            expect(typeof result.weightedScore).toBe('number');
            expect(typeof result.percentageScore).toBe('number');
            expect(typeof result.bonusTier).toBe('string');
        });
        it('should return correct employee ID from final score', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                userId: employeeId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.employeeId).toBe(employeeId.value);
        });
        it('should return correct cycle ID from final score', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                cycleId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.cycleId).toBe(cycleId.value);
        });
        it('should include weighted score and percentage in output', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.weightedScore).toBeDefined();
            expect(result.percentageScore).toBeDefined();
            expect(result.bonusTier).toBeDefined();
        });
    });
    describe('EDGE: Should prevent duplicate delivery', () => {
        it('should allow delivery even if feedback was previously delivered', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Updated feedback notes',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should handle multiple delivery attempts with different notes', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Initial feedback',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result1 = await useCase.execute(input);
            const input2 = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: 'Updated feedback',
            };
            const result2 = await useCase.execute(input2);
            expect(result1.feedbackDelivered).toBe(true);
            expect(result2.feedbackDelivered).toBe(true);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
        });
        it('should update deliveredAt timestamp on redelivery', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result1 = await useCase.execute(input);
            await new Promise(resolve => setTimeout(resolve, 10));
            const result2 = await useCase.execute(input);
            expect(result1.deliveredAt).toBeDefined();
            expect(result2.deliveredAt).toBeDefined();
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
        });
    });
    describe('EDGE: Should handle locked final scores', () => {
        it('should prevent delivery to locked final scores', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const lockedFinalScore = createValidFinalScore({ id: finalScoreId, locked: true });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(lockedFinalScore);
            await expect(useCase.execute(input)).rejects.toThrow();
        });
        it('should not save locked final score after delivery attempt', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const lockedFinalScore = createValidFinalScore({ id: finalScoreId, locked: true });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(lockedFinalScore);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
        it('should allow delivery to unlocked score after being locked then unlocked', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            finalScore.lock();
            finalScore.unlock();
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
    });
    describe('EDGE: Should validate manager authorization', () => {
        it('should accept any deliveredBy user ID as input', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.deliveredBy).toBe(deliveredByUserId.value);
        });
        it('should convert deliveredBy string to UserId value object', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            const markFeedbackDeliveredSpy = jest.spyOn(finalScore, 'markFeedbackDelivered');
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(input);
            expect(markFeedbackDeliveredSpy).toHaveBeenCalledWith(expect.any(Object), undefined);
        });
        it('should track manager ID in delivery audit trail', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const managerId1 = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input1 = {
                finalScoreId: finalScoreId.value,
                deliveredBy: managerId1.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result1 = await useCase.execute(input1);
            expect(result1.deliveredBy).toBe(managerId1.value);
        });
    });
    describe('error handling and edge cases', () => {
        it('should handle missing feedbackNotes gracefully', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.feedbackDelivered).toBe(true);
        });
        it('should handle empty feedbackNotes string', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: '',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should handle long feedbackNotes text', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const deliveredByUserId = user_id_vo_1.UserId.generate();
            const longFeedback = 'A'.repeat(1000);
            const finalScore = createValidFinalScore({ id: finalScoreId });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: deliveredByUserId.value,
                feedbackNotes: longFeedback,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.feedbackDelivered).toBe(true);
        });
    });
    describe('integration: full delivery workflow', () => {
        it('should complete full delivery workflow with all components', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                cycleId,
                userId: employeeId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: managerId.value,
                feedbackNotes: 'Comprehensive performance feedback',
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(mockFinalScoreRepository.findById).toHaveBeenCalledWith(expect.objectContaining({ value: finalScoreId.value }));
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
            expect(result.id).toBe(finalScoreId.value);
            expect(result.employeeId).toBe(employeeId.value);
            expect(result.cycleId).toBe(cycleId.value);
            expect(result.feedbackDelivered).toBe(true);
            expect(result.deliveredAt).toBeDefined();
            expect(result.deliveredBy).toBe(managerId.value);
            expect(result.feedbackNotes).toBe('Comprehensive performance feedback');
        });
        it('should maintain entity relationships through delivery', async () => {
            const finalScoreId = final_score_entity_1.FinalScoreId.generate();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const finalScore = createValidFinalScore({
                id: finalScoreId,
                cycleId,
                userId: employeeId,
            });
            const input = {
                finalScoreId: finalScoreId.value,
                deliveredBy: managerId.value,
            };
            mockFinalScoreRepository.findById.mockResolvedValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(input);
            expect(result.cycleId).toBe(cycleId.value);
            expect(result.employeeId).toBe(employeeId.value);
        });
    });
});
//# sourceMappingURL=deliver-feedback.use-case.spec.js.map