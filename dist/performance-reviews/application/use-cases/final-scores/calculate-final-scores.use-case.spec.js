"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculate_final_scores_use_case_1 = require("./calculate-final-scores.use-case");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
describe('CalculateFinalScoresUseCase', () => {
    let useCase;
    let mockFinalScoreRepository;
    let mockManagerEvaluationRepository;
    let mockCalculationService;
    const createValidManagerEvaluation = (overrides) => {
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const employeeId = overrides?.employeeId || user_id_vo_1.UserId.generate();
        const managerId = overrides?.managerId || user_id_vo_1.UserId.generate();
        const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
            cycleId,
            employeeId,
            managerId,
            scores: overrides?.scores ||
                pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
            narrative: 'Strong overall performance',
            strengths: 'Good technical skills',
            growthAreas: 'Could improve communication',
            developmentPlan: 'Enroll in public speaking course',
            employeeLevel: overrides?.employeeLevel || engineer_level_vo_1.EngineerLevel.MID,
            proposedLevel: overrides?.proposedLevel,
        });
        if (overrides?.status === review_status_vo_1.ReviewStatus.SUBMITTED) {
            evaluation.submit();
        }
        return evaluation;
    };
    const createValidFinalScore = (overrides) => {
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const userId = overrides?.userId || user_id_vo_1.UserId.generate();
        return final_score_entity_1.FinalScore.create({
            cycleId,
            userId,
            pillarScores: overrides?.pillarScores ||
                pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
            weightedScore: overrides?.weightedScore || weighted_score_vo_1.WeightedScore.fromValue(3.2),
            finalLevel: overrides?.finalLevel || engineer_level_vo_1.EngineerLevel.MID,
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
        mockManagerEvaluationRepository = {
            findById: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByManagerAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        mockCalculationService = {
            calculateFinalScore: jest.fn(),
        };
        useCase = new calculate_final_scores_use_case_1.CalculateFinalScoresUseCase(mockFinalScoreRepository, mockManagerEvaluationRepository, mockCalculationService);
    });
    describe('CRITICAL: calculate final scores from manager evaluations', () => {
        it('should fetch evaluations from repository by cycle', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluations = [];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            await useCase.execute(cycleId.value);
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId);
        });
        it('should process all evaluations returned from repository', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation1 = createValidManagerEvaluation({ cycleId });
            const evaluation2 = createValidManagerEvaluation({ cycleId });
            const evaluations = [evaluation1, evaluation2];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScore1 = createValidFinalScore({ cycleId, userId: evaluation1.employeeId });
            const finalScore2 = createValidFinalScore({ cycleId, userId: evaluation2.employeeId });
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScore1)
                .mockReturnValueOnce(finalScore2);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore1).mockResolvedValue(finalScore2);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(1, evaluation1);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(2, evaluation2);
        });
        it('should handle single evaluation correctly', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
        });
        it('should convert cycleId string to ReviewCycleId object', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycleIdString = cycleId.value;
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([]);
            await useCase.execute(cycleIdString);
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(expect.objectContaining({
                value: cycleIdString,
            }));
        });
    });
    describe('CRITICAL: use FinalScoreCalculationService to compute weighted scores', () => {
        it('should call calculateFinalScore service for each evaluation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation);
        });
        it('should pass manager evaluation to calculation service', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId, employeeId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({ cycleId, userId: employeeId });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1);
        });
        it('should use calculated final score from service', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const calculatedFinalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.5),
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(calculatedFinalScore);
            mockFinalScoreRepository.save.mockResolvedValue(calculatedFinalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(calculatedFinalScore);
        });
        it('should calculate weighted score considering multiple pillar scores', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const pillarScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const evaluation = createValidManagerEvaluation({
                cycleId,
                scores: pillarScores,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                pillarScores,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(expect.objectContaining({
                scores: pillarScores,
            }));
        });
    });
    describe('CRITICAL: determine bonus tier based on weighted score', () => {
        it('should create final score with bonus tier based on weighted score', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(3.4);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                weightedScore,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                bonusTier: expect.anything(),
            }));
        });
        it('should include bonus tier in persisted final score (EXCEEDS tier)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(3.4);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                weightedScore,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
            expect(finalScore.bonusTier.isExceeds()).toBe(true);
        });
        it('should handle MEETS bonus tier correctly', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(3.0);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                weightedScore,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(finalScore.bonusTier.isMeets()).toBe(true);
        });
        it('should handle BELOW bonus tier correctly', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(1.6);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                weightedScore,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(finalScore.bonusTier.isBelow()).toBe(true);
        });
    });
    describe('CRITICAL: validate cycle exists', () => {
        it('should accept valid cycle ID string', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycleIdString = cycleId.value;
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([]);
            await useCase.execute(cycleIdString);
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalled();
        });
        it('should process evaluations when cycle has evaluations', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should handle empty evaluation list for cycle', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const cycleIdString = cycleId.value;
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([]);
            await useCase.execute(cycleIdString);
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalled();
            expect(mockCalculationService.calculateFinalScore).not.toHaveBeenCalled();
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: only calculate for submitted manager evaluations', () => {
        it('should only process submitted evaluations', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const submittedEvaluation = createValidManagerEvaluation({
                cycleId,
                status: review_status_vo_1.ReviewStatus.SUBMITTED,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([submittedEvaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: submittedEvaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(submittedEvaluation);
            expect(mockFinalScoreRepository.save).toHaveBeenCalled();
        });
        it('should verify evaluation is submitted before calculation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                status: review_status_vo_1.ReviewStatus.SUBMITTED,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(evaluation.isSubmitted).toBe(true);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: use proposed level if available, otherwise employee level', () => {
        it('should pass evaluation with proposed level to calculation service', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const proposedLevel = engineer_level_vo_1.EngineerLevel.SENIOR;
            const evaluation = createValidManagerEvaluation({
                cycleId,
                proposedLevel,
                employeeLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: proposedLevel,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(expect.objectContaining({
                proposedLevel,
            }));
        });
        it('should use employee level when proposed level is not available', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeLevel = engineer_level_vo_1.EngineerLevel.MID;
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel,
                proposedLevel: undefined,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: employeeLevel,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(expect.objectContaining({
                employeeLevel,
            }));
        });
        it('should include final level in calculated final score', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const proposedLevel = engineer_level_vo_1.EngineerLevel.SENIOR;
            const evaluation = createValidManagerEvaluation({
                cycleId,
                proposedLevel,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: proposedLevel,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: proposedLevel,
            }));
        });
    });
    describe('IMPORTANT: persist final scores to repository', () => {
        it('should save calculated final score to repository', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
        });
        it('should save each calculated final score', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation1 = createValidManagerEvaluation({ cycleId });
            const evaluation2 = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2]);
            const finalScore1 = createValidFinalScore({
                cycleId,
                userId: evaluation1.employeeId,
            });
            const finalScore2 = createValidFinalScore({
                cycleId,
                userId: evaluation2.employeeId,
            });
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScore1)
                .mockReturnValueOnce(finalScore2);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore1).mockResolvedValue(finalScore2);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
            expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(1, finalScore1);
            expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(2, finalScore2);
        });
        it('should persist final score with all required fields', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            const savedScore = mockFinalScoreRepository.save.mock.calls[0][0];
            expect(savedScore).toHaveProperty('userId');
            expect(savedScore).toHaveProperty('cycleId');
            expect(savedScore).toHaveProperty('pillarScores');
            expect(savedScore).toHaveProperty('weightedScore');
            expect(savedScore).toHaveProperty('finalLevel');
        });
        it('should handle repository save errors', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockRejectedValue(new Error('Save failed'));
            await expect(useCase.execute(cycleId.value)).rejects.toThrow('Save failed');
        });
    });
    describe('IMPORTANT: return count of calculated scores', () => {
        it('should complete execution without error on success', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(cycleId.value);
            expect(result).toBeUndefined();
        });
        it('should process multiple evaluations and complete', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluations = [
                createValidManagerEvaluation({ cycleId }),
                createValidManagerEvaluation({ cycleId }),
                createValidManagerEvaluation({ cycleId }),
            ];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScores = evaluations.map((evaluation) => createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            }));
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScores[0])
                .mockReturnValueOnce(finalScores[1])
                .mockReturnValueOnce(finalScores[2]);
            mockFinalScoreRepository.save
                .mockResolvedValueOnce(finalScores[0])
                .mockResolvedValueOnce(finalScores[1])
                .mockResolvedValueOnce(finalScores[2]);
            const result = await useCase.execute(cycleId.value);
            expect(result).toBeUndefined();
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3);
        });
    });
    describe('IMPORTANT: handle employees with no manager evaluation', () => {
        it('should not process when no evaluations found for cycle', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([]);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).not.toHaveBeenCalled();
            expect(mockFinalScoreRepository.save).not.toHaveBeenCalled();
        });
        it('should skip employees without submitted evaluations', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalled();
        });
        it('should handle mixed evaluations (some submitted, some not)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const submittedEvaluation = createValidManagerEvaluation({
                cycleId,
                status: review_status_vo_1.ReviewStatus.SUBMITTED,
            });
            const draftEvaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([
                submittedEvaluation,
                draftEvaluation,
            ]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: submittedEvaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2);
        });
    });
    describe('EDGE: batch calculation for entire cycle', () => {
        it('should calculate scores for entire cycle in one operation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluations = Array.from({ length: 5 }, () => createValidManagerEvaluation({ cycleId }));
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScores = evaluations.map((evaluation) => createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            }));
            finalScores.forEach((score) => {
                mockCalculationService.calculateFinalScore.mockReturnValue(score);
            });
            mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score));
            await useCase.execute(cycleId.value);
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledTimes(1);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(5);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(5);
        });
        it('should process large batch of evaluations sequentially', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluationCount = 10;
            const evaluations = Array.from({ length: evaluationCount }, () => createValidManagerEvaluation({ cycleId }));
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScores = evaluations.map((evaluation) => createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            }));
            finalScores.forEach((score) => {
                mockCalculationService.calculateFinalScore.mockReturnValueOnce(score);
            });
            mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score));
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(10);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(10);
        });
        it('should maintain evaluation order during batch calculation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation1 = createValidManagerEvaluation({ cycleId });
            const evaluation2 = createValidManagerEvaluation({ cycleId });
            const evaluation3 = createValidManagerEvaluation({ cycleId });
            const evaluations = [evaluation1, evaluation2, evaluation3];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScore1 = createValidFinalScore({
                cycleId,
                userId: evaluation1.employeeId,
            });
            const finalScore2 = createValidFinalScore({
                cycleId,
                userId: evaluation2.employeeId,
            });
            const finalScore3 = createValidFinalScore({
                cycleId,
                userId: evaluation3.employeeId,
            });
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScore1)
                .mockReturnValueOnce(finalScore2)
                .mockReturnValueOnce(finalScore3);
            mockFinalScoreRepository.save
                .mockResolvedValueOnce(finalScore1)
                .mockResolvedValueOnce(finalScore2)
                .mockResolvedValueOnce(finalScore3);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(1, evaluation1);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(2, evaluation2);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(3, evaluation3);
        });
    });
    describe('EDGE: skip already calculated scores (idempotent)', () => {
        it('should recalculate scores on subsequent runs', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            mockCalculationService.calculateFinalScore.mockClear();
            mockFinalScoreRepository.save.mockClear();
            mockManagerEvaluationRepository.findByCycle.mockClear();
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1);
        });
        it('should handle idempotent execution for same cycle', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            await useCase.execute(cycleId.value);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2);
        });
    });
    describe('EDGE: handle different engineer levels correctly', () => {
        it('should calculate final score for MID level engineer', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: engineer_level_vo_1.EngineerLevel.MID,
            }));
        });
        it('should calculate final score for SENIOR level engineer', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            }));
        });
        it('should calculate final score for LEAD level engineer', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.LEAD,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: engineer_level_vo_1.EngineerLevel.LEAD,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: engineer_level_vo_1.EngineerLevel.LEAD,
            }));
        });
        it('should handle level promotion (employee to proposed level)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.MID,
                proposedLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            }));
        });
        it('should handle level demotion (employee to proposed level)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
                proposedLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
                finalLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                finalLevel: engineer_level_vo_1.EngineerLevel.MID,
            }));
        });
        it('should calculate scores for mixed engineer levels in batch', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const midLevelEval = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.MID,
            });
            const seniorLevelEval = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            const leadLevelEval = createValidManagerEvaluation({
                cycleId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.LEAD,
            });
            const evaluations = [midLevelEval, seniorLevelEval, leadLevelEval];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScores = [
                createValidFinalScore({
                    cycleId,
                    userId: midLevelEval.employeeId,
                    finalLevel: engineer_level_vo_1.EngineerLevel.MID,
                }),
                createValidFinalScore({
                    cycleId,
                    userId: seniorLevelEval.employeeId,
                    finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
                }),
                createValidFinalScore({
                    cycleId,
                    userId: leadLevelEval.employeeId,
                    finalLevel: engineer_level_vo_1.EngineerLevel.LEAD,
                }),
            ];
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScores[0])
                .mockReturnValueOnce(finalScores[1])
                .mockReturnValueOnce(finalScores[2]);
            mockFinalScoreRepository.save
                .mockResolvedValueOnce(finalScores[0])
                .mockResolvedValueOnce(finalScores[1])
                .mockResolvedValueOnce(finalScores[2]);
            await useCase.execute(cycleId.value);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3);
            expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ finalLevel: engineer_level_vo_1.EngineerLevel.MID }));
            expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(2, expect.objectContaining({ finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR }));
            expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(3, expect.objectContaining({ finalLevel: engineer_level_vo_1.EngineerLevel.LEAD }));
        });
    });
    describe('integration: full workflow', () => {
        it('should complete full calculation workflow successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId });
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation]);
            const finalScore = createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            });
            mockCalculationService.calculateFinalScore.mockReturnValue(finalScore);
            mockFinalScoreRepository.save.mockResolvedValue(finalScore);
            const result = await useCase.execute(cycleId.value);
            expect(result).toBeUndefined();
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore);
        });
        it('should handle full workflow with multiple employees', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const evaluations = [
                createValidManagerEvaluation({ cycleId }),
                createValidManagerEvaluation({ cycleId }),
                createValidManagerEvaluation({ cycleId }),
            ];
            mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations);
            const finalScores = evaluations.map((evaluation) => createValidFinalScore({
                cycleId,
                userId: evaluation.employeeId,
            }));
            mockCalculationService.calculateFinalScore
                .mockReturnValueOnce(finalScores[0])
                .mockReturnValueOnce(finalScores[1])
                .mockReturnValueOnce(finalScores[2]);
            mockFinalScoreRepository.save
                .mockResolvedValueOnce(finalScores[0])
                .mockResolvedValueOnce(finalScores[1])
                .mockResolvedValueOnce(finalScores[2]);
            const result = await useCase.execute(cycleId.value);
            expect(result).toBeUndefined();
            expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId);
            expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(3);
            expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3);
        });
    });
});
//# sourceMappingURL=calculate-final-scores.use-case.spec.js.map