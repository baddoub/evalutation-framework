"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_manager_evaluation_use_case_1 = require("./update-manager-evaluation.use-case");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const manager_evaluation_id_vo_1 = require("../../../domain/value-objects/manager-evaluation-id.vo");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const manager_evaluation_already_submitted_exception_1 = require("../../../domain/exceptions/manager-evaluation-already-submitted.exception");
describe('UpdateManagerEvaluationUseCase', () => {
    let useCase;
    let mockRepository;
    const createValidManagerEvaluation = (overrides) => {
        const id = overrides?.id ?? manager_evaluation_id_vo_1.ManagerEvaluationId.generate();
        const cycleId = overrides?.cycleId ?? review_cycle_id_vo_1.ReviewCycleId.generate();
        const employeeId = overrides?.employeeId ?? user_id_vo_1.UserId.generate();
        const managerId = overrides?.managerId ?? user_id_vo_1.UserId.generate();
        const scores = overrides?.scores ?? pillar_scores_vo_1.PillarScores.create({
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
        });
        return manager_evaluation_entity_1.ManagerEvaluation.create({
            id,
            cycleId,
            employeeId,
            managerId,
            scores,
            narrative: 'Initial evaluation narrative',
            strengths: 'Good technical skills',
            growthAreas: 'Leadership development',
            developmentPlan: 'Mentorship program',
        });
    };
    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByManagerAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        useCase = new update_manager_evaluation_use_case_1.UpdateManagerEvaluationUseCase(mockRepository);
    });
    describe('CRITICAL: Find Evaluation by ID', () => {
        it('should find evaluation by ID when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const evaluationId = evaluation.id;
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluationId.value,
            };
            const result = await useCase.execute(input);
            expect(mockRepository.findById).toHaveBeenCalledWith(manager_evaluation_id_vo_1.ManagerEvaluationId.fromString(evaluationId.value));
            expect(result).toBeDefined();
            expect(result.id).toBe(evaluationId.value);
        });
        it('should use evaluationId lookup when both ID and cycle+employee are provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                cycleId,
                employeeId,
            };
            await useCase.execute(input);
            expect(mockRepository.findById).toHaveBeenCalled();
            expect(mockRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Find Evaluation by CycleId + EmployeeId', () => {
        it('should find evaluation by cycleId and employeeId when ID not provided', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId, employeeId });
            mockRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                cycleId,
                employeeId,
            };
            const result = await useCase.execute(input);
            expect(mockRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(result).toBeDefined();
            expect(result.cycleId).toBe(cycleId.value);
            expect(result.employeeId).toBe(employeeId.value);
        });
        it('should not call findByEmployeeAndCycle when evaluationId is provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
                employeeId: user_id_vo_1.UserId.generate(),
            };
            await useCase.execute(input);
            expect(mockRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Should Update Scores', () => {
        it('should update scores when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                evaluationId: evaluation.id.value,
                scores: newScoresData,
            };
            await useCase.execute(input);
            expect(evaluation.scores.projectImpact.value).toBe(newScoresData.projectImpact);
            expect(evaluation.scores.direction.value).toBe(newScoresData.direction);
            expect(evaluation.scores.engineeringExcellence.value).toBe(newScoresData.engineeringExcellence);
            expect(evaluation.scores.operationalOwnership.value).toBe(newScoresData.operationalOwnership);
            expect(evaluation.scores.peopleImpact.value).toBe(newScoresData.peopleImpact);
        });
        it('should call updateScores() on entity when scores provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateScoresSpy = jest.spyOn(evaluation, 'updateScores');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                evaluationId: evaluation.id.value,
                scores: newScoresData,
            };
            await useCase.execute(input);
            expect(updateScoresSpy).toHaveBeenCalledTimes(1);
            expect(updateScoresSpy).toHaveBeenCalledWith(expect.any(pillar_scores_vo_1.PillarScores));
        });
    });
    describe('CRITICAL: Should Update Performance Narrative', () => {
        it('should update performance narrative when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newNarrative = 'Updated performance narrative';
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: newNarrative,
            };
            await useCase.execute(input);
            expect(evaluation.performanceNarrative).toBe(newNarrative);
        });
        it('should call updatePerformanceNarrative() on entity when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateNarrativeSpy = jest.spyOn(evaluation, 'updatePerformanceNarrative');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: 'Updated narrative',
            };
            await useCase.execute(input);
            expect(updateNarrativeSpy).toHaveBeenCalledTimes(1);
            expect(updateNarrativeSpy).toHaveBeenCalledWith(expect.any(narrative_vo_1.Narrative));
        });
    });
    describe('CRITICAL: Should Update Growth Areas', () => {
        it('should update growth areas when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newGrowthAreas = 'Focus on leadership skills';
            const input = {
                evaluationId: evaluation.id.value,
                growthAreas: newGrowthAreas,
            };
            await useCase.execute(input);
            expect(evaluation.growthAreas).toBe(newGrowthAreas);
        });
        it('should call updateGrowthAreas() on entity when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateGrowthAreasSpy = jest.spyOn(evaluation, 'updateGrowthAreas');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                growthAreas: 'Development areas',
            };
            await useCase.execute(input);
            expect(updateGrowthAreasSpy).toHaveBeenCalledTimes(1);
            expect(updateGrowthAreasSpy).toHaveBeenCalledWith(expect.any(narrative_vo_1.Narrative));
        });
    });
    describe('CRITICAL: Should Update Proposed Level', () => {
        it('should update proposed level when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newLevel = 'senior';
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: newLevel,
            };
            await useCase.execute(input);
            expect(evaluation.proposedLevel).toBeDefined();
            expect(evaluation.proposedLevel?.value).toBe('SENIOR');
        });
        it('should call updateProposedLevel() on entity when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateProposedLevelSpy = jest.spyOn(evaluation, 'updateProposedLevel');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'senior',
            };
            await useCase.execute(input);
            expect(updateProposedLevelSpy).toHaveBeenCalledTimes(1);
            expect(updateProposedLevelSpy).toHaveBeenCalledWith(expect.any(engineer_level_vo_1.EngineerLevel));
        });
    });
    describe('CRITICAL: Should Update Manager Comments', () => {
        it('should update manager comments when provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const managerComments = 'Manager feedback and observations';
            const input = {
                evaluationId: evaluation.id.value,
                managerComments,
            };
            await useCase.execute(input);
            expect(evaluation.performanceNarrative).toBe(managerComments);
        });
        it('should call updatePerformanceNarrative() for manager comments', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateNarrativeSpy = jest.spyOn(evaluation, 'updatePerformanceNarrative');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                managerComments: 'Manager observations',
            };
            await useCase.execute(input);
            expect(updateNarrativeSpy).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: Should Throw Error if Evaluation Not Found', () => {
        it('should throw error when evaluation not found by ID', async () => {
            mockRepository.findById.mockResolvedValue(null);
            const input = {
                evaluationId: manager_evaluation_id_vo_1.ManagerEvaluationId.generate().value,
            };
            await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation not found');
        });
        it('should throw error when evaluation not found by cycle and employee', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            mockRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const input = {
                cycleId,
                employeeId,
            };
            await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation not found');
        });
        it('should throw error when neither lookup method returns evaluation', async () => {
            mockRepository.findById.mockResolvedValue(null);
            const input = {
                evaluationId: manager_evaluation_id_vo_1.ManagerEvaluationId.generate().value,
            };
            await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation not found');
            expect(mockRepository.findById).toHaveBeenCalled();
        });
    });
    describe('IMPORTANT: Handle Partial Updates', () => {
        it('should handle updating only scores without other fields', async () => {
            const evaluation = createValidManagerEvaluation();
            const originalNarrative = evaluation.performanceNarrative;
            const originalGrowthAreas = evaluation.growthAreas;
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                evaluationId: evaluation.id.value,
                scores: newScoresData,
            };
            await useCase.execute(input);
            expect(evaluation.scores.projectImpact.value).toBe(newScoresData.projectImpact);
            expect(evaluation.performanceNarrative).toBe(originalNarrative);
            expect(evaluation.growthAreas).toBe(originalGrowthAreas);
        });
        it('should handle updating only performance narrative without scores', async () => {
            const evaluation = createValidManagerEvaluation();
            const originalScores = {
                projectImpact: evaluation.scores.projectImpact.value,
                direction: evaluation.scores.direction.value,
            };
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newNarrative = 'Updated narrative only';
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: newNarrative,
            };
            await useCase.execute(input);
            expect(evaluation.performanceNarrative).toBe(newNarrative);
            expect(evaluation.scores.projectImpact.value).toBe(originalScores.projectImpact);
            expect(evaluation.scores.direction.value).toBe(originalScores.direction);
        });
        it('should handle updating growth areas only', async () => {
            const evaluation = createValidManagerEvaluation();
            const originalScores = evaluation.scores.projectImpact.value;
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newGrowthAreas = 'Updated growth areas';
            const input = {
                evaluationId: evaluation.id.value,
                growthAreas: newGrowthAreas,
            };
            await useCase.execute(input);
            expect(evaluation.growthAreas).toBe(newGrowthAreas);
            expect(evaluation.scores.projectImpact.value).toBe(originalScores);
        });
        it('should handle updating proposed level only', async () => {
            const evaluation = createValidManagerEvaluation();
            const originalScores = evaluation.scores.projectImpact.value;
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'lead',
            };
            await useCase.execute(input);
            expect(evaluation.proposedLevel?.value).toBe('LEAD');
            expect(evaluation.scores.projectImpact.value).toBe(originalScores);
        });
        it('should maintain original values when partial update provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const originalNarrative = evaluation.narrative;
            const originalGrowthAreas = evaluation.growthAreas;
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(evaluation.narrative).toBe(originalNarrative);
            expect(evaluation.growthAreas).toBe(originalGrowthAreas);
        });
    });
    describe('IMPORTANT: Repository Persistence', () => {
        it('should persist changes via repository save', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(mockRepository.save).toHaveBeenCalledWith(evaluation);
            expect(mockRepository.save).toHaveBeenCalledTimes(1);
        });
        it('should call save with the modified evaluation entity', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                evaluationId: evaluation.id.value,
                scores: newScoresData,
            };
            await useCase.execute(input);
            const savedEntity = mockRepository.save.mock.calls[0][0];
            expect(savedEntity.scores.projectImpact.value).toBe(newScoresData.projectImpact);
        });
        it('should persist even with empty update', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
            };
            await useCase.execute(input);
            expect(mockRepository.save).toHaveBeenCalledWith(evaluation);
        });
    });
    describe('IMPORTANT: Return Updated DTO', () => {
        it('should return updated DTO with correct values', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const newScoresData = {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            };
            const input = {
                evaluationId: evaluation.id.value,
                scores: newScoresData,
            };
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('cycleId');
            expect(result).toHaveProperty('employeeId');
            expect(result).toHaveProperty('managerId');
            expect(result).toHaveProperty('scores');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('updatedAt');
        });
        it('should return correct DTO values matching entity state', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            const result = await useCase.execute(input);
            expect(result.id).toBe(evaluation.id.value);
            expect(result.cycleId).toBe(evaluation.cycleId.value);
            expect(result.employeeId).toBe(evaluation.employeeId.value);
            expect(result.managerId).toBe(evaluation.managerId.value);
            expect(result.scores.projectImpact).toBe(4);
            expect(result.scores.direction).toBe(3);
            expect(result.scores.engineeringExcellence).toBe(4);
            expect(result.scores.operationalOwnership).toBe(4);
            expect(result.scores.peopleImpact).toBe(3);
        });
        it('should include updatedAt timestamp in response', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const beforeExecution = new Date();
            const input = {
                evaluationId: evaluation.id.value,
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
        it('should return DTO with all required fields populated', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: 'Updated narrative',
            };
            const result = await useCase.execute(input);
            expect(result.id).toBeDefined();
            expect(result.cycleId).toBeDefined();
            expect(result.employeeId).toBeDefined();
            expect(result.managerId).toBeDefined();
            expect(result.status).toBeDefined();
            expect(result.updatedAt).toBeDefined();
        });
    });
    describe('EDGE: Update Already Submitted Evaluation', () => {
        it('should throw error when trying to update scores on submitted evaluation', async () => {
            const evaluation = createValidManagerEvaluation();
            evaluation.submit();
            mockRepository.findById.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should throw error when trying to update performance narrative on submitted evaluation', async () => {
            const evaluation = createValidManagerEvaluation();
            evaluation.submit();
            mockRepository.findById.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: 'Updated narrative',
            };
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should throw error when trying to update growth areas on submitted evaluation', async () => {
            const evaluation = createValidManagerEvaluation();
            evaluation.submit();
            mockRepository.findById.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                growthAreas: 'Updated growth areas',
            };
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should throw error when trying to update proposed level on submitted evaluation', async () => {
            const evaluation = createValidManagerEvaluation();
            evaluation.submit();
            mockRepository.findById.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'senior',
            };
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should throw error when trying to update manager comments on submitted evaluation', async () => {
            const evaluation = createValidManagerEvaluation();
            evaluation.submit();
            mockRepository.findById.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                managerComments: 'Manager comments',
            };
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
    });
    describe('EDGE: Handle Empty Update', () => {
        it('should handle empty update with no fields provided', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockRepository.save).toHaveBeenCalledWith(evaluation);
        });
        it('should not call updateScores when scores not provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateScoresSpy = jest.spyOn(evaluation, 'updateScores');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: 'Narrative only',
            };
            await useCase.execute(input);
            expect(updateScoresSpy).not.toHaveBeenCalled();
        });
        it('should not call updatePerformanceNarrative when performanceNarrative not provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateNarrativeSpy = jest.spyOn(evaluation, 'updatePerformanceNarrative');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(updateNarrativeSpy).not.toHaveBeenCalled();
        });
        it('should not call updateGrowthAreas when growthAreas not provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateGrowthAreasSpy = jest.spyOn(evaluation, 'updateGrowthAreas');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(updateGrowthAreasSpy).not.toHaveBeenCalled();
        });
        it('should not call updateProposedLevel when proposedLevel not provided', async () => {
            const evaluation = createValidManagerEvaluation();
            const updateProposedLevelSpy = jest.spyOn(evaluation, 'updateProposedLevel');
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(updateProposedLevelSpy).not.toHaveBeenCalled();
        });
    });
    describe('EDGE: Validate Proposed Level is Valid EngineerLevel', () => {
        it('should accept valid engineer level "junior"', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'junior',
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(evaluation.proposedLevel?.value).toBe('JUNIOR');
        });
        it('should accept valid engineer level "mid"', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'mid',
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(evaluation.proposedLevel?.value).toBe('MID');
        });
        it('should accept valid engineer level "senior"', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'senior',
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(evaluation.proposedLevel?.value).toBe('SENIOR');
        });
        it('should accept valid engineer level "lead"', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'lead',
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(evaluation.proposedLevel?.value).toBe('LEAD');
        });
        it('should create EngineerLevel from proposed level string', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const updateProposedLevelSpy = jest.spyOn(evaluation, 'updateProposedLevel');
            const input = {
                evaluationId: evaluation.id.value,
                proposedLevel: 'senior',
            };
            await useCase.execute(input);
            expect(updateProposedLevelSpy).toHaveBeenCalledWith(expect.any(engineer_level_vo_1.EngineerLevel));
        });
    });
    describe('Integration: Full Workflow', () => {
        it('should execute complete update workflow with all fields', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const evaluation = createValidManagerEvaluation({ cycleId, employeeId });
            mockRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                cycleId,
                employeeId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                performanceNarrative: 'Comprehensive performance evaluation',
                growthAreas: 'Leadership and mentoring',
                proposedLevel: 'senior',
                managerComments: 'Excellent work this cycle',
            };
            const result = await useCase.execute(input);
            expect(mockRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(mockRepository.save).toHaveBeenCalledWith(evaluation);
            expect(result).toBeDefined();
            expect(result.scores.projectImpact).toBe(4);
        });
        it('should use evaluationId when provided instead of cycle+employee lookup', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
                employeeId: user_id_vo_1.UserId.generate(),
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
            };
            await useCase.execute(input);
            expect(mockRepository.findById).toHaveBeenCalled();
            expect(mockRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
        });
        it('should apply updates in correct order without interference', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                performanceNarrative: 'Performance narrative',
                growthAreas: 'Growth areas',
                proposedLevel: 'senior',
                managerComments: 'Manager comments',
            };
            const result = await useCase.execute(input);
            expect(evaluation.scores.projectImpact.value).toBe(4);
            expect(evaluation.performanceNarrative).toBe('Manager comments');
            expect(evaluation.growthAreas).toBe('Growth areas');
            expect(evaluation.proposedLevel?.value).toBe('SENIOR');
            expect(result).toBeDefined();
        });
    });
    describe('Boundary Conditions', () => {
        it('should handle minimum valid scores', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
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
            expect(result.scores.direction).toBe(0);
            expect(mockRepository.save).toHaveBeenCalled();
        });
        it('should handle maximum valid scores', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
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
            expect(result.scores.engineeringExcellence).toBe(4);
            expect(result.scores.operationalOwnership).toBe(4);
            expect(result.scores.peopleImpact).toBe(4);
        });
        it('should handle empty string narrative', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: '',
            };
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
        });
        it('should handle long narrative text', async () => {
            const evaluation = createValidManagerEvaluation();
            mockRepository.findById.mockResolvedValue(evaluation);
            mockRepository.save.mockResolvedValue(evaluation);
            const longText = 'A'.repeat(1000);
            const input = {
                evaluationId: evaluation.id.value,
                performanceNarrative: longText,
            };
            const result = await useCase.execute(input);
            expect(evaluation.performanceNarrative).toBe(longText);
            expect(result).toBeDefined();
        });
    });
});
//# sourceMappingURL=update-manager-evaluation.use-case.spec.js.map