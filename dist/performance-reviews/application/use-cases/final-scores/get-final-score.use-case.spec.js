"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_final_score_use_case_1 = require("./get-final-score.use-case");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
describe('GetFinalScoreUseCase', () => {
    let useCase;
    let finalScoreRepository;
    const createValidInput = () => ({
        employeeId: user_id_vo_1.UserId.generate().value,
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate().value,
    });
    const createValidFinalScore = (cycleId, employeeId) => {
        return final_score_entity_1.FinalScore.create({
            cycleId,
            userId: employeeId,
            pillarScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.14),
            finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
            peerAverageScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            peerFeedbackCount: 5,
            calculatedAt: new Date('2024-06-01'),
            feedbackNotes: 'Great performance overall',
        });
    };
    beforeEach(() => {
        finalScoreRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            findByBonusTier: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new get_final_score_use_case_1.GetFinalScoreUseCase(finalScoreRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve final score by employee and cycle', () => {
            it('should return existing final score with all data populated', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const existingScore = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(existingScore);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.id).toBe(existingScore.id.value);
                expect(result.employeeId).toBe(employeeId);
                expect(result.cycleId).toBe(cycleId);
                expect(result.finalScores).toBeDefined();
                expect(result.percentageScore).toBeCloseTo(78.5, 1);
                expect(result.bonusTier).toBe('MEETS');
                expect(result.finalLevel).toBe('SENIOR');
            });
            it('should call findByEmployeeAndCycle with correct parameters', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const existingScore = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(existingScore);
                await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(expect.objectContaining({ _value: employeeId }), expect.objectContaining({ _value: cycleId }));
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1);
            });
            it('should preserve all score values from repository', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const existingScore = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(existingScore);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores.projectImpact).toBe(3);
                expect(result.finalScores.direction).toBe(2);
                expect(result.finalScores.engineeringExcellence).toBe(4);
                expect(result.finalScores.operationalOwnership).toBe(3);
                expect(result.finalScores.peopleImpact).toBe(2);
            });
            it('should handle multiple retrievals with different employees', async () => {
                const input1 = createValidInput();
                const input2 = createValidInput();
                const empId1 = user_id_vo_1.UserId.fromString(input1.employeeId);
                const cycId1 = review_cycle_id_vo_1.ReviewCycleId.create(input1.cycleId);
                const empId2 = user_id_vo_1.UserId.fromString(input2.employeeId);
                const cycId2 = review_cycle_id_vo_1.ReviewCycleId.create(input2.cycleId);
                const score1 = createValidFinalScore(cycId1, empId1);
                const score2 = createValidFinalScore(cycId2, empId2);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score1);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score2);
                const result1 = await useCase.execute(input1.employeeId, input1.cycleId);
                const result2 = await useCase.execute(input2.employeeId, input2.cycleId);
                expect(result1.id).toBe(score1.id.value);
                expect(result2.id).toBe(score2.id.value);
                expect(result1.employeeId).toBe(input1.employeeId);
                expect(result2.employeeId).toBe(input2.employeeId);
            });
        });
        describe('CRITICAL: Should validate employee exists', () => {
            it('should accept valid employee ID', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.employeeId).toBe(employeeId);
            });
            it('should use provided employee ID in repository call', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalled();
                const callArgs = finalScoreRepository.findByEmployeeAndCycle.mock.calls[0];
                expect(callArgs[0].value).toBe(employeeId);
            });
            it('should handle different employee IDs correctly', async () => {
                const empId1 = user_id_vo_1.UserId.generate().value;
                const empId2 = user_id_vo_1.UserId.generate().value;
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate().value;
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(empId1, cycleId);
                await useCase.execute(empId2, cycleId);
                const firstCall = finalScoreRepository.findByEmployeeAndCycle.mock.calls[0][0];
                const secondCall = finalScoreRepository.findByEmployeeAndCycle.mock.calls[1][0];
                expect(firstCall.value).toBe(empId1);
                expect(secondCall.value).toBe(empId2);
            });
        });
        describe('CRITICAL: Should validate cycle exists', () => {
            it('should accept valid cycle ID', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.cycleId).toBe(cycleId);
            });
            it('should use provided cycle ID in repository call', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalled();
                const callArgs = finalScoreRepository.findByEmployeeAndCycle.mock.calls[0];
                expect(callArgs[1].value).toBe(cycleId);
            });
            it('should handle different cycle IDs correctly', async () => {
                const employeeId = user_id_vo_1.UserId.generate().value;
                const cycleId1 = review_cycle_id_vo_1.ReviewCycleId.generate().value;
                const cycleId2 = review_cycle_id_vo_1.ReviewCycleId.generate().value;
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(employeeId, cycleId1);
                await useCase.execute(employeeId, cycleId2);
                const firstCall = finalScoreRepository.findByEmployeeAndCycle.mock.calls[0][1];
                const secondCall = finalScoreRepository.findByEmployeeAndCycle.mock.calls[1][1];
                expect(firstCall.value).toBe(cycleId1);
                expect(secondCall.value).toBe(cycleId2);
            });
        });
        describe('CRITICAL: Should return complete final score data', () => {
            it('should return all pillar scores', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores).toEqual({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
            });
            it('should return weighted score and percentage', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.weightedScore).toBeCloseTo(3.14, 2);
                expect(result.percentageScore).toBeCloseTo(78.5, 1);
            });
            it('should return bonus tier', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.bonusTier).toBe('MEETS');
            });
            it('should return final level', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalLevel).toBe('SENIOR');
            });
            it('should return calculated at timestamp', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.calculatedAt).toBeDefined();
                expect(result.calculatedAt instanceof Date).toBe(true);
            });
            it('should include all required IDs', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.id).toBeDefined();
                expect(typeof result.id).toBe('string');
                expect(result.employeeId).toBeDefined();
                expect(result.cycleId).toBeDefined();
            });
        });
        describe('IMPORTANT: Should return correct DTO structure', () => {
            it('should return output with all required fields', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('employeeId');
                expect(result).toHaveProperty('cycleId');
                expect(result).toHaveProperty('finalScores');
                expect(result).toHaveProperty('weightedScore');
                expect(result).toHaveProperty('percentageScore');
                expect(result).toHaveProperty('bonusTier');
                expect(result).toHaveProperty('finalLevel');
                expect(result).toHaveProperty('calculatedAt');
            });
            it('should return DTO with correct structure for finalScores', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores).toHaveProperty('projectImpact');
                expect(result.finalScores).toHaveProperty('direction');
                expect(result.finalScores).toHaveProperty('engineeringExcellence');
                expect(result.finalScores).toHaveProperty('operationalOwnership');
                expect(result.finalScores).toHaveProperty('peopleImpact');
                expect(typeof result.finalScores.projectImpact).toBe('number');
                expect(typeof result.finalScores.direction).toBe('number');
                expect(typeof result.finalScores.engineeringExcellence).toBe('number');
                expect(typeof result.finalScores.operationalOwnership).toBe('number');
                expect(typeof result.finalScores.peopleImpact).toBe('number');
            });
            it('should return DTO as GetFinalScoreOutput interface', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(typeof result.id).toBe('string');
                expect(typeof result.employeeId).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(typeof result.bonusTier).toBe('string');
                expect(typeof result.finalLevel).toBe('string');
            });
            it('should return string IDs (not value objects)', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(typeof result.id).toBe('string');
                expect(typeof result.employeeId).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(!result.id.includes('Object')).toBe(true);
                expect(!result.employeeId.includes('Object')).toBe(true);
            });
            it('should return numeric scores (not value objects)', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(typeof result.weightedScore).toBe('number');
                expect(typeof result.percentageScore).toBe('number');
                expect(typeof result.finalScores.projectImpact).toBe('number');
            });
        });
        describe('IMPORTANT: Should handle missing final score', () => {
            it('should return null when final score does not exist', async () => {
                const { employeeId, cycleId } = createValidInput();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeNull();
            });
            it('should not throw error when score not found', async () => {
                const { employeeId, cycleId } = createValidInput();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await expect(useCase.execute(employeeId, cycleId)).resolves.toBeNull();
            });
            it('should call repository even when result is null', async () => {
                const { employeeId, cycleId } = createValidInput();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1);
            });
            it('should handle empty result gracefully', async () => {
                const { employeeId, cycleId } = createValidInput();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeNull();
                expect(result === null).toBe(true);
            });
        });
        describe('IMPORTANT: Should include delivery status', () => {
            it('should include deliveredAt when set', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const deliveredDate = new Date('2024-06-15');
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 2,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.14),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                    deliveredAt: deliveredDate,
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.deliveredAt).toBeDefined();
                expect(result.deliveredAt).toEqual(deliveredDate);
            });
            it('should include deliveredBy when set', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const deliveredByUserId = user_id_vo_1.UserId.generate();
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 2,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.14),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                    deliveredBy: deliveredByUserId,
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.deliveredBy).toBeDefined();
                expect(result.deliveredBy).toBe(deliveredByUserId.value);
            });
            it('should not include deliveredAt when not set', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                score._deliveredAt = undefined;
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.deliveredAt).toBeUndefined();
            });
            it('should return deliveredBy as string when present', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const deliveredByUserId = user_id_vo_1.UserId.generate();
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 2,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.14),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                    deliveredBy: deliveredByUserId,
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(typeof result.deliveredBy).toBe('string');
            });
            it('should include feedbackDelivered status', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toHaveProperty('feedbackDelivered');
                expect(typeof result.feedbackDelivered).toBe('boolean');
            });
            it('should include feedbackNotes when available', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.feedbackNotes).toBe('Great performance overall');
            });
        });
        describe('EDGE: Should handle locked vs unlocked scores', () => {
            it('should return unlocked score data', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.finalScores).toBeDefined();
            });
            it('should return locked score data', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                score.lock();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.finalScores).toBeDefined();
                expect(result.weightedScore).toBeCloseTo(3.14, 2);
            });
            it('should return same data regardless of lock status', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const unlockedScore = createValidFinalScore(cycId, empId);
                const lockedScore = createValidFinalScore(cycId, empId);
                lockedScore.lock();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(unlockedScore);
                const result1 = await useCase.execute(employeeId, cycleId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(lockedScore);
                const result2 = await useCase.execute(employeeId, cycleId);
                expect(result1.finalScores).toEqual(result2.finalScores);
                expect(result1.weightedScore).toBe(result2.weightedScore);
                expect(result1.bonusTier).toBe(result2.bonusTier);
            });
            it('should handle locked score with all data intact', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                score.lock();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.id).toBe(score.id.value);
                expect(result.employeeId).toBe(employeeId);
                expect(result.cycleId).toBe(cycleId);
                expect(result.finalScores.projectImpact).toBe(3);
                expect(result.bonusTier).toBe('MEETS');
            });
        });
        describe('EDGE: Should verify authorization (manager can view their reports)', () => {
            it('should return score without verifying authorization', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
            });
            it('should work with any valid employee ID', async () => {
                const employeeId1 = user_id_vo_1.UserId.generate().value;
                const employeeId2 = user_id_vo_1.UserId.generate().value;
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate().value;
                const empId1 = user_id_vo_1.UserId.fromString(employeeId1);
                const empId2 = user_id_vo_1.UserId.fromString(employeeId2);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score1 = createValidFinalScore(cycId, empId1);
                const score2 = createValidFinalScore(cycId, empId2);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score1);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score2);
                const result1 = await useCase.execute(employeeId1, cycleId);
                const result2 = await useCase.execute(employeeId2, cycleId);
                expect(result1.employeeId).toBe(employeeId1);
                expect(result2.employeeId).toBe(employeeId2);
            });
        });
        describe('EDGE: Should handle calibrated scores', () => {
            it('should return calibrated score data', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 4,
                        direction: 3,
                        engineeringExcellence: 4,
                        operationalOwnership: 4,
                        peopleImpact: 3,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.4),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('LEAD'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.finalScores.projectImpact).toBe(4);
                expect(result.bonusTier).toBe('EXCEEDS');
                expect(result.finalLevel).toBe('LEAD');
            });
            it('should preserve calibrated scores correctly', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const calibratedScores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                });
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: calibratedScores,
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.28),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('MANAGER'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores.projectImpact).toBe(4);
                expect(result.finalScores.direction).toBe(4);
                expect(result.finalScores.engineeringExcellence).toBe(4);
                expect(result.finalScores.operationalOwnership).toBe(4);
                expect(result.finalScores.peopleImpact).toBe(4);
            });
            it('should handle high bonus tier for calibrated scores', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 4,
                        direction: 4,
                        engineeringExcellence: 4,
                        operationalOwnership: 4,
                        peopleImpact: 4,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.8),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('MANAGER'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.bonusTier).toBe('EXCEEDS');
                expect(result.percentageScore).toBeCloseTo(95.0, 1);
            });
        });
        describe('IMPORTANT: Should handle repository errors', () => {
            it('should throw error if repository find fails', async () => {
                const { employeeId, cycleId } = createValidInput();
                const error = new Error('Database connection failed');
                finalScoreRepository.findByEmployeeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(employeeId, cycleId)).rejects.toThrow('Database connection failed');
            });
            it('should propagate repository errors without modification', async () => {
                const { employeeId, cycleId } = createValidInput();
                const originalError = new Error('Original error message');
                finalScoreRepository.findByEmployeeAndCycle.mockRejectedValue(originalError);
                await expect(useCase.execute(employeeId, cycleId)).rejects.toBe(originalError);
            });
            it('should handle timeout errors from repository', async () => {
                const { employeeId, cycleId } = createValidInput();
                const timeoutError = new Error('Repository timeout');
                finalScoreRepository.findByEmployeeAndCycle.mockRejectedValue(timeoutError);
                await expect(useCase.execute(employeeId, cycleId)).rejects.toThrow('Repository timeout');
            });
        });
        describe('EDGE: Should handle various score values', () => {
            it('should handle minimum score values', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 1,
                        direction: 1,
                        engineeringExcellence: 1,
                        operationalOwnership: 1,
                        peopleImpact: 1,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(1.6),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('JUNIOR'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores.projectImpact).toBe(1);
                expect(result.bonusTier).toBe('BELOW');
            });
            it('should handle maximum score values', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 4,
                        direction: 4,
                        engineeringExcellence: 4,
                        operationalOwnership: 4,
                        peopleImpact: 4,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(4.0),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('MANAGER'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores.projectImpact).toBe(4);
                expect(result.percentageScore).toBeCloseTo(100.0, 1);
                expect(result.bonusTier).toBe('EXCEEDS');
            });
            it('should handle mixed score values', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 4,
                        engineeringExcellence: 3,
                        operationalOwnership: 4,
                        peopleImpact: 1,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(2.6),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.finalScores.projectImpact).toBe(2);
                expect(result.finalScores.direction).toBe(4);
                expect(result.finalScores.engineeringExcellence).toBe(3);
                expect(result.finalScores.operationalOwnership).toBe(4);
                expect(result.finalScores.peopleImpact).toBe(1);
            });
        });
        describe('EDGE: Should handle optional fields correctly', () => {
            it('should handle score without feedback notes', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 2,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(2.8),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.feedbackNotes).toBeUndefined();
            });
            it('should handle score with peer feedback data', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const peerScores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 3,
                    operationalOwnership: 3,
                    peopleImpact: 3,
                });
                const score = final_score_entity_1.FinalScore.create({
                    cycleId: cycId,
                    userId: empId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 2,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(2.8),
                    finalLevel: engineer_level_vo_1.EngineerLevel.create('SENIOR'),
                    peerAverageScores: peerScores,
                    peerFeedbackCount: 5,
                });
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result).toBeDefined();
                expect(result.finalScores).toEqual({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: retrieve existing score', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
                expect(result).toBeDefined();
                expect(result.id).toBe(score.id.value);
                expect(result.employeeId).toBe(employeeId);
                expect(result.cycleId).toBe(cycleId);
            });
            it('should handle scenario: score not found returns null', async () => {
                const { employeeId, cycleId } = createValidInput();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(employeeId, cycleId);
                expect(finalScoreRepository.findByEmployeeAndCycle).toHaveBeenCalled();
                expect(result).toBeNull();
            });
            it('should maintain data integrity across retrieval', async () => {
                const { employeeId, cycleId } = createValidInput();
                const empId = user_id_vo_1.UserId.fromString(employeeId);
                const cycId = review_cycle_id_vo_1.ReviewCycleId.create(cycleId);
                const score = createValidFinalScore(cycId, empId);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValue(score);
                const result = await useCase.execute(employeeId, cycleId);
                expect(result.cycleId).toBe(score.cycleId.value);
                expect(result.employeeId).toBe(score.employeeId.value);
                expect(result.finalScores.projectImpact).toBe(score.finalScores.projectImpact.value);
                expect(result.bonusTier).toBe(score.bonusTier.value);
            });
            it('should handle multiple sequential calls with different inputs', async () => {
                const input1 = createValidInput();
                const input2 = createValidInput();
                const empId1 = user_id_vo_1.UserId.fromString(input1.employeeId);
                const cycId1 = review_cycle_id_vo_1.ReviewCycleId.create(input1.cycleId);
                const empId2 = user_id_vo_1.UserId.fromString(input2.employeeId);
                const cycId2 = review_cycle_id_vo_1.ReviewCycleId.create(input2.cycleId);
                const score1 = createValidFinalScore(cycId1, empId1);
                const score2 = createValidFinalScore(cycId2, empId2);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score1);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(score2);
                const result1 = await useCase.execute(input1.employeeId, input1.cycleId);
                const result2 = await useCase.execute(input2.employeeId, input2.cycleId);
                expect(result1.id).toBe(score1.id.value);
                expect(result2.id).toBe(score2.id.value);
                expect(result1.employeeId).toBe(input1.employeeId);
                expect(result2.employeeId).toBe(input2.employeeId);
            });
            it('should handle locked and unlocked scores in sequence', async () => {
                const input1 = createValidInput();
                const input2 = createValidInput();
                const empId1 = user_id_vo_1.UserId.fromString(input1.employeeId);
                const cycId1 = review_cycle_id_vo_1.ReviewCycleId.create(input1.cycleId);
                const empId2 = user_id_vo_1.UserId.fromString(input2.employeeId);
                const cycId2 = review_cycle_id_vo_1.ReviewCycleId.create(input2.cycleId);
                const unlockedScore = createValidFinalScore(cycId1, empId1);
                const lockedScore = createValidFinalScore(cycId2, empId2);
                lockedScore.lock();
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(unlockedScore);
                finalScoreRepository.findByEmployeeAndCycle.mockResolvedValueOnce(lockedScore);
                const result1 = await useCase.execute(input1.employeeId, input1.cycleId);
                const result2 = await useCase.execute(input2.employeeId, input2.cycleId);
                expect(result1.finalScores.projectImpact).toBe(3);
                expect(result2.finalScores.projectImpact).toBe(3);
                expect(result1.bonusTier).toBe(result2.bonusTier);
            });
        });
    });
});
//# sourceMappingURL=get-final-score.use-case.spec.js.map