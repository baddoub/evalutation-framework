"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_manager_evaluation_use_case_1 = require("./get-manager-evaluation.use-case");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
describe('GetManagerEvaluationUseCase', () => {
    let useCase;
    let managerEvaluationRepository;
    const createValidInput = () => ({
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
        employeeId: user_id_vo_1.UserId.generate(),
        managerId: user_id_vo_1.UserId.generate(),
    });
    const createValidManagerEvaluation = (cycleId, employeeId, managerId) => {
        return manager_evaluation_entity_1.ManagerEvaluation.create({
            cycleId,
            employeeId,
            managerId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            narrative: 'Manager evaluation narrative',
            strengths: 'Good communication skills',
            growthAreas: 'Leadership development',
            developmentPlan: 'Enroll in leadership course',
            performanceNarrative: 'Strong performer',
            proposedLevel: undefined,
        });
    };
    beforeEach(() => {
        managerEvaluationRepository = {
            findById: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByManagerAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new get_manager_evaluation_use_case_1.GetManagerEvaluationUseCase(managerEvaluationRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve existing manager evaluation when found', () => {
            it('should return existing evaluation with all data populated', async () => {
                const input = createValidInput();
                const existingEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.id).toBe(existingEvaluation.id.value);
                expect(result.cycleId).toBe(input.cycleId.value);
                expect(result.employeeId).toBe(input.employeeId.value);
                expect(result.managerId).toBe(input.managerId.value);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.scores).toEqual({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                expect(result.managerComments).toBe('Manager evaluation narrative');
            });
            it('should call findByEmployeeAndCycle with correct parameters', async () => {
                const input = createValidInput();
                const existingEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
                await useCase.execute(input);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1);
            });
            it('should not call save when evaluation already exists', async () => {
                const input = createValidInput();
                const existingEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
                await useCase.execute(input);
                expect(managerEvaluationRepository.save).not.toHaveBeenCalled();
            });
            it('should return evaluation with submitted status if evaluation was submitted', async () => {
                const input = createValidInput();
                const submittedEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                submittedEvaluation.submit();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.submittedAt).toBeDefined();
                expect(result.submittedAt instanceof Date).toBe(true);
            });
            it('should return evaluation with calibrated status if evaluation was calibrated', async () => {
                const input = createValidInput();
                const calibratedEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                calibratedEvaluation.submit();
                calibratedEvaluation.calibrate();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(calibratedEvaluation);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED.value);
                expect(result.submittedAt).toBeDefined();
            });
            it('should include all optional fields when populated', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.performanceNarrative).toBe('Strong performer');
                expect(result.growthAreas).toBe('Leadership development');
            });
            it('should handle evaluations with null optional fields', async () => {
                const input = createValidInput();
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 2,
                        engineeringExcellence: 2,
                        operationalOwnership: 2,
                        peopleImpact: 2,
                    }),
                    narrative: 'Simple narrative',
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.id).toBe(evaluation.id.value);
            });
        });
        describe('CRITICAL: Should return null when evaluation not found', () => {
            it('should return null when evaluation does not exist', async () => {
                const input = createValidInput();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result).toBeNull();
            });
            it('should not call save when evaluation not found', async () => {
                const input = createValidInput();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(managerEvaluationRepository.save).not.toHaveBeenCalled();
            });
            it('should still validate parameters before checking repository', async () => {
                const input = createValidInput();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalled();
            });
        });
        describe('CRITICAL: Should verify manager-employee relationship (throw error if not direct report)', () => {
            it('should accept valid manager-employee relationship in input', async () => {
                const employeeId = user_id_vo_1.UserId.generate();
                const managerId = user_id_vo_1.UserId.generate();
                const input = {
                    cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
                    employeeId,
                    managerId,
                };
                const evaluation = createValidManagerEvaluation(input.cycleId, employeeId, managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.managerId).toBe(managerId.value);
            });
            it('should use the provided manager ID from input', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.managerId).toBe(input.managerId.value);
            });
            it('should accept unique manager and employee IDs', async () => {
                const managerId = user_id_vo_1.UserId.generate();
                const employeeId = user_id_vo_1.UserId.generate();
                expect(managerId.value).not.toBe(employeeId.value);
                const input = {
                    cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
                    employeeId,
                    managerId,
                };
                const evaluation = createValidManagerEvaluation(input.cycleId, employeeId, managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.employeeId).toBe(employeeId.value);
                expect(result.managerId).toBe(managerId.value);
            });
            it('should maintain manager-employee relationship from input throughout execution', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.employeeId).toBe(input.employeeId.value);
                expect(result.managerId).toBe(input.managerId.value);
            });
        });
        describe('IMPORTANT: Should return correct DTO structure', () => {
            it('should return output with all required fields', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('cycleId');
                expect(result).toHaveProperty('employeeId');
                expect(result).toHaveProperty('managerId');
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('scores');
            });
            it('should return DTO with correct structure for scores', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
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
            it('should return DTO as GetManagerEvaluationOutput interface', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(typeof result.id).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(typeof result.employeeId).toBe('string');
                expect(typeof result.managerId).toBe('string');
                expect(typeof result.status).toBe('string');
            });
            it('should return string IDs (not value objects)', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(typeof result.id).toBe('string');
                expect(typeof result.cycleId).toBe('string');
                expect(typeof result.employeeId).toBe('string');
                expect(typeof result.managerId).toBe('string');
                expect(typeof result.status).toBe('string');
            });
            it('should include submittedAt only when evaluation is submitted', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                evaluation.submit();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.submittedAt).toBeDefined();
                expect(result.submittedAt instanceof Date).toBe(true);
            });
            it('should not include submittedAt when evaluation is in draft', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.submittedAt).toBeUndefined();
            });
            it('should include optional fields in DTO', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('managerComments');
                expect(result).toHaveProperty('performanceNarrative');
                expect(result).toHaveProperty('growthAreas');
                expect(result).toHaveProperty('proposedLevel');
            });
        });
        describe('IMPORTANT: Should handle repository errors', () => {
            it('should throw error if repository find fails', async () => {
                const input = createValidInput();
                const error = new Error('Database connection failed');
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
            });
            it('should throw error if repository throws custom exception', async () => {
                const input = createValidInput();
                const customError = new Error('Custom repository error');
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
            it('should propagate repository errors without modification', async () => {
                const input = createValidInput();
                const originalError = new Error('Original error message');
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(originalError);
                await expect(useCase.execute(input)).rejects.toBe(originalError);
            });
            it('should fail immediately on repository error', async () => {
                const input = createValidInput();
                const error = new Error('Repository failed');
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error);
                try {
                    await useCase.execute(input);
                    fail('Should have thrown error');
                }
                catch (e) {
                    expect(e.message).toBe('Repository failed');
                }
            });
            it('should handle timeout errors from repository', async () => {
                const input = createValidInput();
                const timeoutError = new Error('Repository timeout');
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(timeoutError);
                await expect(useCase.execute(input)).rejects.toThrow('Repository timeout');
            });
        });
        describe('EDGE: Should handle submitted evaluations', () => {
            it('should return submitted evaluation with status and submittedAt', async () => {
                const input = createValidInput();
                const submittedEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                submittedEvaluation.submit();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.submittedAt).toBeDefined();
            });
            it('should handle calibrated evaluation', async () => {
                const input = createValidInput();
                const calibratedEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                calibratedEvaluation.submit();
                calibratedEvaluation.calibrate();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(calibratedEvaluation);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED.value);
            });
            it('should include all scores even when evaluation is submitted', async () => {
                const input = createValidInput();
                const submittedEvaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                submittedEvaluation.submit();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation);
                const result = await useCase.execute(input);
                expect(result.scores.projectImpact).toBeDefined();
                expect(result.scores.direction).toBeDefined();
                expect(result.scores.engineeringExcellence).toBeDefined();
                expect(result.scores.operationalOwnership).toBeDefined();
                expect(result.scores.peopleImpact).toBeDefined();
            });
            it('should handle evaluation with various score ranges', async () => {
                const input = createValidInput();
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 1,
                        direction: 4,
                        engineeringExcellence: 3,
                        operationalOwnership: 4,
                        peopleImpact: 2,
                    }),
                    narrative: 'Mixed scores evaluation',
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.scores.projectImpact).toBe(1);
                expect(result.scores.direction).toBe(4);
                expect(result.scores.engineeringExcellence).toBe(3);
                expect(result.scores.operationalOwnership).toBe(4);
                expect(result.scores.peopleImpact).toBe(2);
            });
            it('should handle evaluation with zero scores', async () => {
                const input = createValidInput();
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 0,
                        direction: 0,
                        engineeringExcellence: 0,
                        operationalOwnership: 0,
                        peopleImpact: 0,
                    }),
                    narrative: 'Zero scores evaluation',
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.scores.projectImpact).toBe(0);
                expect(result.scores.direction).toBe(0);
                expect(result.scores.engineeringExcellence).toBe(0);
                expect(result.scores.operationalOwnership).toBe(0);
                expect(result.scores.peopleImpact).toBe(0);
            });
        });
        describe('EDGE: Should handle empty/null optional fields', () => {
            it('should handle evaluation with empty narrative', async () => {
                const input = createValidInput();
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 2,
                        engineeringExcellence: 2,
                        operationalOwnership: 2,
                        peopleImpact: 2,
                    }),
                    narrative: '',
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.managerComments).toBe('');
            });
            it('should handle evaluation with undefined proposedLevel', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.proposedLevel).toBeUndefined();
            });
            it('should handle evaluation with very long narrative', async () => {
                const input = createValidInput();
                const longNarrative = 'word '.repeat(1000);
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 3,
                        direction: 3,
                        engineeringExcellence: 3,
                        operationalOwnership: 3,
                        peopleImpact: 3,
                    }),
                    narrative: longNarrative,
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.managerComments).toBe(longNarrative);
            });
            it('should handle evaluation with special characters in narrative', async () => {
                const input = createValidInput();
                const specialNarrative = 'Evaluation & comments with "quotes" and \'apostrophes\' and émojis 🎉';
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    cycleId: input.cycleId,
                    employeeId: input.employeeId,
                    managerId: input.managerId,
                    scores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 2,
                        engineeringExcellence: 2,
                        operationalOwnership: 2,
                        peopleImpact: 2,
                    }),
                    narrative: specialNarrative,
                    strengths: '',
                    growthAreas: '',
                    developmentPlan: '',
                });
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.managerComments).toBe(specialNarrative);
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: retrieve existing evaluation', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(managerEvaluationRepository.save).not.toHaveBeenCalled();
                expect(result).toBeDefined();
                expect(result.id).toBe(evaluation.id.value);
            });
            it('should handle scenario: evaluation not found returns null', async () => {
                const input = createValidInput();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(result).toBeNull();
            });
            it('should maintain data integrity across retrieval', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.cycleId).toBe(evaluation.cycleId.value);
                expect(result.employeeId).toBe(evaluation.employeeId.value);
                expect(result.managerId).toBe(evaluation.managerId.value);
                expect(result.scores).toEqual(evaluation.scores.toPlainObject());
                expect(result.status).toBe(evaluation.status.value);
            });
            it('should handle multiple sequential calls with different inputs', async () => {
                const input1 = createValidInput();
                const input2 = createValidInput();
                const evaluation1 = createValidManagerEvaluation(input1.cycleId, input1.employeeId, input1.managerId);
                const evaluation2 = createValidManagerEvaluation(input2.cycleId, input2.employeeId, input2.managerId);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(evaluation1);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(evaluation2);
                const result1 = await useCase.execute(input1);
                const result2 = await useCase.execute(input2);
                expect(result1.id).toBe(evaluation1.id.value);
                expect(result2.id).toBe(evaluation2.id.value);
                expect(result1.employeeId).toBe(input1.employeeId.value);
                expect(result2.employeeId).toBe(input2.employeeId.value);
            });
            it('should handle submitted evaluation retrieval', async () => {
                const input = createValidInput();
                const evaluation = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                evaluation.submit();
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
                const result = await useCase.execute(input);
                expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.submittedAt).toBeDefined();
                expect(result.id).toBe(evaluation.id.value);
            });
        });
    });
});
//# sourceMappingURL=get-manager-evaluation.use-case.spec.js.map