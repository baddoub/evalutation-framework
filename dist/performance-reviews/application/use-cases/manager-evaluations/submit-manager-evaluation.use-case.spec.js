"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const submit_manager_evaluation_use_case_1 = require("./submit-manager-evaluation.use-case");
const manager_evaluation_already_submitted_exception_1 = require("../../../domain/exceptions/manager-evaluation-already-submitted.exception");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
describe('SubmitManagerEvaluationUseCase', () => {
    let useCase;
    let mockManagerEvaluationRepository;
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
    const createValidEmployee = (overrides) => {
        const id = overrides?.id || user_id_vo_1.UserId.generate();
        const managerId = overrides?.managerId || user_id_vo_1.UserId.generate().value;
        return user_entity_1.User.create({
            id,
            email: email_vo_1.Email.create('employee@example.com'),
            name: 'Employee Name',
            keycloakId: 'keycloak-employee-id',
            roles: [role_vo_1.Role.user()],
            isActive: true,
            managerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    const createValidManagerEvaluation = (overrides) => {
        const cycleId = overrides?.cycleId || review_cycle_id_vo_1.ReviewCycleId.generate();
        const employeeId = overrides?.employeeId || user_id_vo_1.UserId.generate();
        const managerId = overrides?.managerId || user_id_vo_1.UserId.generate();
        return manager_evaluation_entity_1.ManagerEvaluation.create({
            id: overrides?.id,
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
        });
    };
    beforeEach(() => {
        mockManagerEvaluationRepository = {
            findById: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByManagerAndCycle: jest.fn(),
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
        mockUserRepository = {
            findById: jest.fn(),
            findByKeycloakId: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            existsByEmail: jest.fn(),
            findByRole: jest.fn(),
            findByManagerId: jest.fn(),
        };
        useCase = new submit_manager_evaluation_use_case_1.SubmitManagerEvaluationUseCase(mockManagerEvaluationRepository, mockCycleRepository, mockUserRepository);
    });
    describe('CRITICAL: successful submission', () => {
        it('should submit new manager evaluation successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
            expect(result.submittedAt).toBeInstanceOf(Date);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalled();
        });
        it('should submit existing evaluation (update then submit)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const existingEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: 'Updated performance narrative',
                strengths: 'Updated strengths',
                growthAreas: 'Updated growth areas',
                developmentPlan: 'Updated development plan',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
            const updatedEvaluation = createValidManagerEvaluation({
                id: existingEvaluation.id,
                cycleId,
                employeeId,
                managerId,
                scores: pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }),
            });
            updatedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation);
        });
        it('should return correct DTO with submitted status', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('employeeId');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('scores');
            expect(result).toHaveProperty('submittedAt');
            expect(typeof result.id).toBe('string');
            expect(typeof result.employeeId).toBe('string');
            expect(typeof result.status).toBe('string');
            expect(result.submittedAt).toBeInstanceOf(Date);
        });
        it('should set submittedAt timestamp', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const beforeSubmit = new Date();
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            const afterSubmit = new Date();
            expect(result.submittedAt).toBeDefined();
            expect(result.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
            expect(result.submittedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
        });
    });
    describe('CRITICAL: validation - cycle exists', () => {
        it('should throw ReviewNotFoundException if cycle does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow(`Review cycle with ID ${cycleId.value} not found`);
        });
        it('should not proceed to validate employee if cycle does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: validation - deadline has not passed', () => {
        it('should throw Error if manager evaluation deadline has passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation deadline has passed');
        });
        it('should check deadline using cycle.hasDeadlinePassed method with managerEvaluation parameter', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const hasDeadlinePassedSpy = jest.spyOn(cycle, 'hasDeadlinePassed');
            hasDeadlinePassedSpy.mockReturnValue(true);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(hasDeadlinePassedSpy).toHaveBeenCalledWith('managerEvaluation');
        });
        it('should not proceed to validate employee if deadline has passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });
        it('should allow submission when deadline has not passed', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockUserRepository.findById).toHaveBeenCalled();
        });
    });
    describe('CRITICAL: validation - employee exists', () => {
        it('should throw ReviewNotFoundException if employee does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            await expect(useCase.execute(input)).rejects.toThrow('Employee not found');
        });
        it('should not proceed to verify manager relationship if employee does not exist', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('CRITICAL: validation - manager-employee relationship', () => {
        it('should throw Error if manager is not employee\'s direct manager', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const differentManagerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: differentManagerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            await expect(useCase.execute(input)).rejects.toThrow('You can only evaluate your direct reports');
        });
        it('should verify manager-employee relationship with correct manager ID', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalled();
        });
        it('should allow submission when manager-employee relationship is valid', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
        });
    });
    describe('CRITICAL: validation - required fields', () => {
        it('should create PillarScores from input scores', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
                scores: pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }),
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(result.scores.projectImpact).toBe(4);
            expect(result.scores.direction).toBe(4);
            expect(result.scores.engineeringExcellence).toBe(4);
            expect(result.scores.operationalOwnership).toBe(4);
            expect(result.scores.peopleImpact).toBe(3);
        });
        it('should include narrative in evaluation creation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const narrativeText = 'Comprehensive performance narrative';
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: narrativeText,
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalled();
        });
        it('should include strengths and growthAreas in evaluation creation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Excellent problem solver',
                growthAreas: 'Leadership development',
                developmentPlan: 'Mentor junior engineers',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalled();
        });
    });
    describe('IMPORTANT: entity behavior', () => {
        it('should call submit() on entity', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            const submitCalled = jest.fn();
            jest.spyOn(savedEvaluation, 'submit').mockImplementation(submitCalled);
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            await useCase.execute(input);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalled();
        });
        it('should persist to repository', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            await useCase.execute(input);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1);
        });
        it('should update scores when evaluation exists', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const existingEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: 'Updated narrative',
                strengths: 'Updated strengths',
                growthAreas: 'Updated growth areas',
                developmentPlan: 'Updated development plan',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
            const updatedEvaluation = createValidManagerEvaluation({
                id: existingEvaluation.id,
                cycleId,
                employeeId,
                managerId,
                scores: pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }),
            });
            updatedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation);
        });
    });
    describe('EDGE: already submitted evaluation', () => {
        it('should handle already submitted evaluation (entity should throw ManagerEvaluationAlreadySubmittedException)', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const review = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            review.submit();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(review);
            await expect(useCase.execute(input)).rejects.toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should not save when review is already submitted', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            const review = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            review.submit();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(review);
            try {
                await useCase.execute(input);
            }
            catch {
            }
            expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled();
        });
    });
    describe('EDGE: create or update based on existence', () => {
        it('should create new evaluation when not found', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalled();
        });
        it('should update existing evaluation instead of creating new one', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const existingEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: 'Updated narrative',
                strengths: 'Updated strengths',
                growthAreas: 'Updated growth areas',
                developmentPlan: 'Updated development plan',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
            const updatedEvaluation = createValidManagerEvaluation({
                id: existingEvaluation.id,
                cycleId,
                employeeId,
                managerId,
            });
            updatedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation);
            const result = await useCase.execute(input);
            expect(result).toBeDefined();
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation);
        });
    });
    describe('error precedence', () => {
        it('should validate cycle before checking employee', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(null);
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });
        it('should check deadline before verifying manager relationship', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation deadline has passed');
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });
        it('should validate employee before creating evaluation', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
        });
    });
    describe('integration: full workflow scenarios', () => {
        it('should complete full submission workflow successfully', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                },
                narrative: 'Strong overall performance',
                strengths: 'Good technical skills',
                growthAreas: 'Could improve communication',
                developmentPlan: 'Enroll in public speaking course',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
            const savedEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            savedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation);
            const result = await useCase.execute(input);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
            expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId);
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
            expect(result.submittedAt).toBeDefined();
        });
        it('should handle full update and submit workflow', async () => {
            const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
            const employeeId = user_id_vo_1.UserId.generate();
            const managerId = user_id_vo_1.UserId.generate();
            const cycle = createValidReviewCycle();
            const employee = createValidEmployee({ id: employeeId, managerId: managerId.value });
            jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false);
            const existingEvaluation = createValidManagerEvaluation({
                cycleId,
                employeeId,
                managerId,
            });
            const input = {
                employeeId,
                managerId,
                cycleId,
                scores: {
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                },
                narrative: 'Excellent performance overall',
                strengths: 'Outstanding technical skills',
                growthAreas: 'Continue improving communication',
                developmentPlan: 'Lead architecture review',
            };
            mockCycleRepository.findById.mockResolvedValue(cycle);
            mockUserRepository.findById.mockResolvedValue(employee);
            mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation);
            const updatedEvaluation = createValidManagerEvaluation({
                id: existingEvaluation.id,
                cycleId,
                employeeId,
                managerId,
                scores: pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }),
            });
            updatedEvaluation.submit();
            mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation);
            const result = await useCase.execute(input);
            expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId);
            expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId);
            expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(employeeId, cycleId);
            expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
            expect(result.scores.projectImpact).toBe(4);
        });
    });
});
//# sourceMappingURL=submit-manager-evaluation.use-case.spec.js.map