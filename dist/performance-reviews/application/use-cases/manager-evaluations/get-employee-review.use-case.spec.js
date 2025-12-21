"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_employee_review_use_case_1 = require("./get-employee-review.use-case");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const peer_feedback_entity_1 = require("../../../domain/entities/peer-feedback.entity");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const unauthorized_review_access_exception_1 = require("../../../domain/exceptions/unauthorized-review-access.exception");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
describe('GetEmployeeReviewUseCase', () => {
    let useCase;
    let userRepository;
    let cycleRepository;
    let selfReviewRepository;
    let peerFeedbackRepository;
    let managerEvaluationRepository;
    let aggregationService;
    const createValidInput = (overrides) => ({
        employeeId: user_id_vo_1.UserId.generate(),
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
        managerId: user_id_vo_1.UserId.generate(),
        ...overrides,
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
    const createValidUser = (overrides) => {
        return user_entity_1.User.create({
            id: overrides?.id ?? user_id_vo_1.UserId.generate(),
            email: email_vo_1.Email.create('test@example.com'),
            name: 'John Doe',
            keycloakId: 'kc-' + Math.random(),
            roles: [role_vo_1.Role.create('USER')],
            isActive: true,
            level: 'Senior Engineer',
            department: 'Engineering',
            jobTitle: 'Software Engineer',
            managerId: overrides?.managerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    const createValidSelfReview = (cycleId, userId) => {
        return self_review_entity_1.SelfReview.create({
            cycleId,
            userId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            narrative: narrative_vo_1.Narrative.create('This is my self-review narrative'),
        });
    };
    const createValidPeerFeedback = (cycleId, revieweeId, reviewerId) => {
        return peer_feedback_entity_1.PeerFeedback.create({
            cycleId,
            revieweeId,
            reviewerId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 2,
                peopleImpact: 3,
            }),
            strengths: 'Great technical skills',
            growthAreas: 'Leadership skills',
            generalComments: 'Overall good performer',
        });
    };
    const createValidManagerEvaluation = (cycleId, employeeId, managerId) => {
        return manager_evaluation_entity_1.ManagerEvaluation.create({
            cycleId,
            employeeId,
            managerId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 3,
            }),
            narrative: 'Excellent performer this year',
            strengths: 'Technical expertise and delivery',
            growthAreas: 'Cross-team collaboration',
            developmentPlan: 'Mentor junior engineers',
        });
    };
    beforeEach(() => {
        userRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByKeycloakId: jest.fn(),
            findByRole: jest.fn(),
            findByManagerId: jest.fn(),
            existsByEmail: jest.fn(),
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
        selfReviewRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        peerFeedbackRepository = {
            findById: jest.fn(),
            findByRevieweeAndCycle: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByReviewerAndCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        managerEvaluationRepository = {
            findById: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByManagerAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        aggregationService = {
            aggregatePeerScores: jest.fn(),
        };
        useCase = new get_employee_review_use_case_1.GetEmployeeReviewUseCase(userRepository, cycleRepository, selfReviewRepository, peerFeedbackRepository, managerEvaluationRepository, aggregationService);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve complete employee review data', () => {
            it('should retrieve all review components with complete data', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                const peerFeedback1 = createValidPeerFeedback(input.cycleId, input.employeeId, user_id_vo_1.UserId.generate());
                const peerFeedback2 = createValidPeerFeedback(input.cycleId, input.employeeId, user_id_vo_1.UserId.generate());
                const managerEval = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                const reviewer1 = createValidUser();
                const reviewer2 = createValidUser();
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(reviewer1)
                    .mockResolvedValueOnce(reviewer2);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
                    peerFeedback1,
                    peerFeedback2,
                ]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval);
                aggregationService.aggregatePeerScores.mockReturnValue(pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }));
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.employee).toBeDefined();
                expect(result.selfReview).toBeDefined();
                expect(result.peerFeedback).toBeDefined();
                expect(result.managerEvaluation).toBeDefined();
                expect(result.peerFeedback.count).toBe(2);
                expect(result.peerFeedback.attributedFeedback).toHaveLength(2);
            });
            it('should include all employee details in response', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.employee.id).toBe(employee.id.value);
                expect(result.employee.name).toBe(employee.name);
                expect(result.employee.email).toBe(employee.email.value);
                expect(result.employee.level).toBe('Senior Engineer');
                expect(result.employee.department).toBe('Engineering');
            });
            it('should include all self-review components in response', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                selfReview.submit();
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.selfReview.scores).toEqual({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                expect(result.selfReview.narrative).toBe('This is my self-review narrative');
                expect(result.selfReview.submittedAt).toBeDefined();
            });
            it('should include all manager evaluation components in response', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const managerEval = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval);
                const result = await useCase.execute(input);
                expect(result.managerEvaluation).toBeDefined();
                expect(result.managerEvaluation?.id).toBe(managerEval.id.value);
                expect(result.managerEvaluation?.status).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.managerEvaluation?.scores).toEqual({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 3,
                });
                expect(result.managerEvaluation?.narrative).toBe('Excellent performer this year');
                expect(result.managerEvaluation?.strengths).toBe('Technical expertise and delivery');
                expect(result.managerEvaluation?.growthAreas).toBe('Cross-team collaboration');
                expect(result.managerEvaluation?.developmentPlan).toBe('Mentor junior engineers');
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
            it('should not proceed to employee lookup if cycle validation fails', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(userRepository.findById).not.toHaveBeenCalled();
            });
        });
        describe('CRITICAL: Should validate employee exists', () => {
            it('should throw ReviewNotFoundException if employee does not exist', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            });
            it('should throw ReviewNotFoundException with employee not found message', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow('Employee not found');
            });
            it('should call userRepository.findById with employee ID', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(userRepository.findById).toHaveBeenCalledWith(input.employeeId);
            });
            it('should not proceed to authorization check if employee does not exist', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(userRepository.findById).toHaveBeenCalledTimes(1);
            });
        });
        describe('CRITICAL: Should aggregate peer feedback correctly', () => {
            it('should aggregate multiple peer feedback scores correctly', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const peerFeedback1 = createValidPeerFeedback(input.cycleId, input.employeeId, user_id_vo_1.UserId.generate());
                const peerFeedback2 = createValidPeerFeedback(input.cycleId, input.employeeId, user_id_vo_1.UserId.generate());
                const reviewer1 = createValidUser();
                const reviewer2 = createValidUser();
                const aggregatedScores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(reviewer1)
                    .mockResolvedValueOnce(reviewer2);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
                    peerFeedback1,
                    peerFeedback2,
                ]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                aggregationService.aggregatePeerScores.mockReturnValue(aggregatedScores);
                const result = await useCase.execute(input);
                expect(aggregationService.aggregatePeerScores).toHaveBeenCalledWith([
                    peerFeedback1,
                    peerFeedback2,
                ]);
                expect(result.peerFeedback.aggregatedScores).toEqual({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                });
            });
            it('should return zero scores when no peer feedback exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.peerFeedback.aggregatedScores).toEqual({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                expect(aggregationService.aggregatePeerScores).not.toHaveBeenCalled();
            });
            it('should include individual peer feedback with reviewer names', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const reviewerId1 = user_id_vo_1.UserId.generate();
                const reviewerId2 = user_id_vo_1.UserId.generate();
                const peerFeedback1 = createValidPeerFeedback(input.cycleId, input.employeeId, reviewerId1);
                const peerFeedback2 = createValidPeerFeedback(input.cycleId, input.employeeId, reviewerId2);
                const reviewer1 = createValidUser({ id: reviewerId1 });
                const reviewer2 = createValidUser({ id: reviewerId2 });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(reviewer1)
                    .mockResolvedValueOnce(reviewer2);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
                    peerFeedback1,
                    peerFeedback2,
                ]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                aggregationService.aggregatePeerScores.mockReturnValue(pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }));
                const result = await useCase.execute(input);
                expect(result.peerFeedback.attributedFeedback).toHaveLength(2);
                expect(result.peerFeedback.attributedFeedback[0].reviewerId).toBe(reviewerId1.value);
                expect(result.peerFeedback.attributedFeedback[0].reviewerName).toBe('John Doe');
                expect(result.peerFeedback.attributedFeedback[1].reviewerId).toBe(reviewerId2.value);
                expect(result.peerFeedback.attributedFeedback[1].reviewerName).toBe('John Doe');
            });
            it('should handle unknown reviewer gracefully', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const peerFeedback = createValidPeerFeedback(input.cycleId, input.employeeId, user_id_vo_1.UserId.generate());
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(null);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([peerFeedback]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                aggregationService.aggregatePeerScores.mockReturnValue(pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }));
                const result = await useCase.execute(input);
                expect(result.peerFeedback.attributedFeedback[0].reviewerName).toBe('Unknown');
            });
        });
        describe('CRITICAL: Should verify manager-employee relationship', () => {
            it('should throw UnauthorizedReviewAccessException if manager does not exist', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(null);
                await expect(useCase.execute(input)).rejects.toThrow(unauthorized_review_access_exception_1.UnauthorizedReviewAccessException);
            });
            it('should throw UnauthorizedReviewAccessException with correct message if manager not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(null);
                await expect(useCase.execute(input)).rejects.toThrow('Manager not found');
            });
            it('should throw UnauthorizedReviewAccessException if employee is not a direct report', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const differentManagerId = user_id_vo_1.UserId.generate();
                const employee = createValidUser({
                    id: input.employeeId,
                    managerId: differentManagerId.value,
                });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                await expect(useCase.execute(input)).rejects.toThrow(unauthorized_review_access_exception_1.UnauthorizedReviewAccessException);
            });
            it('should throw UnauthorizedReviewAccessException with correct message for unauthorized access', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const differentManagerId = user_id_vo_1.UserId.generate();
                const employee = createValidUser({
                    id: input.employeeId,
                    managerId: differentManagerId.value,
                });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                await expect(useCase.execute(input)).rejects.toThrow('You can only view reviews of your direct reports');
            });
            it('should succeed if manager-employee relationship is valid', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.employee.id).toBe(input.employeeId.value);
            });
        });
        describe('IMPORTANT: Should return correct DTO structure with all components', () => {
            it('should return output with all required fields', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('employee');
                expect(result).toHaveProperty('selfReview');
                expect(result).toHaveProperty('peerFeedback');
                expect(result).toHaveProperty('managerEvaluation');
            });
            it('should return DTO with correct employee structure', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.employee).toHaveProperty('id');
                expect(result.employee).toHaveProperty('name');
                expect(result.employee).toHaveProperty('email');
                expect(result.employee).toHaveProperty('level');
                expect(result.employee).toHaveProperty('department');
                expect(typeof result.employee.id).toBe('string');
                expect(typeof result.employee.name).toBe('string');
                expect(typeof result.employee.email).toBe('string');
            });
            it('should return DTO with correct selfReview structure', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.selfReview).toHaveProperty('scores');
                expect(result.selfReview).toHaveProperty('narrative');
                expect(result.selfReview.scores).toHaveProperty('projectImpact');
                expect(result.selfReview.scores).toHaveProperty('direction');
                expect(result.selfReview.scores).toHaveProperty('engineeringExcellence');
                expect(result.selfReview.scores).toHaveProperty('operationalOwnership');
                expect(result.selfReview.scores).toHaveProperty('peopleImpact');
            });
            it('should return DTO with correct peerFeedback structure', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.peerFeedback).toHaveProperty('count');
                expect(result.peerFeedback).toHaveProperty('aggregatedScores');
                expect(result.peerFeedback).toHaveProperty('attributedFeedback');
                expect(Array.isArray(result.peerFeedback.attributedFeedback)).toBe(true);
            });
            it('should return DTO as GetEmployeeReviewOutput interface', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(typeof result.employee.id).toBe('string');
                expect(typeof result.employee.name).toBe('string');
                expect(typeof result.selfReview.narrative).toBe('string');
                expect(typeof result.peerFeedback.count).toBe('number');
            });
        });
        describe('IMPORTANT: Should handle missing self-review gracefully', () => {
            it('should return zero scores when self-review is not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.selfReview.scores).toEqual({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
            });
            it('should return empty narrative when self-review is not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.selfReview.narrative).toBe('');
            });
            it('should not include submittedAt when self-review is not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.selfReview.submittedAt).toBeUndefined();
            });
        });
        describe('IMPORTANT: Should handle missing peer feedback gracefully', () => {
            it('should return zero count when no peer feedback exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.peerFeedback.count).toBe(0);
            });
            it('should return empty attributedFeedback array when no peer feedback exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.peerFeedback.attributedFeedback).toEqual([]);
            });
            it('should not call aggregationService when no peer feedback exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(aggregationService.aggregatePeerScores).not.toHaveBeenCalled();
            });
        });
        describe('IMPORTANT: Should handle missing manager evaluation gracefully', () => {
            it('should return undefined managerEvaluation when none exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.managerEvaluation).toBeUndefined();
            });
            it('should handle partial manager evaluation data', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const managerEval = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval);
                const result = await useCase.execute(input);
                expect(result.managerEvaluation).toBeDefined();
                expect(result.managerEvaluation?.id).toBeDefined();
                expect(result.managerEvaluation?.status).toBeDefined();
            });
        });
        describe('EDGE: Should handle employee with no reviews at all', () => {
            it('should return complete structure even when employee has no reviews', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.employee).toBeDefined();
                expect(result.selfReview).toBeDefined();
                expect(result.peerFeedback).toBeDefined();
                expect(result.selfReview.scores).toEqual({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                expect(result.peerFeedback.count).toBe(0);
                expect(result.managerEvaluation).toBeUndefined();
            });
            it('should return employee data even with no reviews', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.employee.id).toBe(input.employeeId.value);
                expect(result.employee.name).toBe('John Doe');
                expect(result.employee.email).toBeDefined();
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow with all data populated', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                const reviewerId1 = user_id_vo_1.UserId.generate();
                const reviewerId2 = user_id_vo_1.UserId.generate();
                const peerFeedback1 = createValidPeerFeedback(input.cycleId, input.employeeId, reviewerId1);
                const peerFeedback2 = createValidPeerFeedback(input.cycleId, input.employeeId, reviewerId2);
                const reviewer1 = createValidUser({ id: reviewerId1 });
                const reviewer2 = createValidUser({ id: reviewerId2 });
                const managerEval = createValidManagerEvaluation(input.cycleId, input.employeeId, input.managerId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(reviewer1)
                    .mockResolvedValueOnce(reviewer2);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
                    peerFeedback1,
                    peerFeedback2,
                ]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval);
                aggregationService.aggregatePeerScores.mockReturnValue(pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }));
                const result = await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(userRepository.findById).toHaveBeenCalledWith(input.employeeId);
                expect(userRepository.findById).toHaveBeenCalledWith(input.managerId);
                expect(selfReviewRepository.findByUserAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
                expect(result.peerFeedback.count).toBe(2);
                expect(result.managerEvaluation).toBeDefined();
            });
            it('should properly hydrate peer feedback with reviewer details', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const reviewerId = user_id_vo_1.UserId.generate();
                const peerFeedback = createValidPeerFeedback(input.cycleId, input.employeeId, reviewerId);
                const reviewer = createValidUser({ id: reviewerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById
                    .mockResolvedValueOnce(employee)
                    .mockResolvedValueOnce(manager)
                    .mockResolvedValueOnce(reviewer);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([peerFeedback]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                aggregationService.aggregatePeerScores.mockReturnValue(pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }));
                const result = await useCase.execute(input);
                const attributedFeedback = result.peerFeedback.attributedFeedback[0];
                expect(attributedFeedback.reviewerId).toBe(reviewerId.value);
                expect(attributedFeedback.reviewerName).toBe('John Doe');
                expect(attributedFeedback.scores).toEqual({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                });
                expect(attributedFeedback.strengths).toBe('Great technical skills');
                expect(attributedFeedback.growthAreas).toBe('Leadership skills');
                expect(attributedFeedback.generalComments).toBe('Overall good performer');
            });
            it('should maintain data consistency across all components', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const selfReview = createValidSelfReview(input.cycleId, input.employeeId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                const result = await useCase.execute(input);
                expect(result.employee.id).toBe(employee.id.value);
                expect(result.selfReview.scores).toEqual({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                expect(result.selfReview.narrative).toBe('This is my self-review narrative');
            });
        });
        describe('Repository interaction tests', () => {
            it('should call all repositories with proper invocations', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalled();
                expect(userRepository.findById).toHaveBeenCalled();
            });
            it('should fetch peer feedback with correct parameters', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
            });
            it('should fetch manager evaluation with correct parameters', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null);
                await useCase.execute(input);
                expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(input.employeeId, input.cycleId);
            });
        });
        describe('Error handling', () => {
            it('should throw error if cycle repository fails', async () => {
                const input = createValidInput();
                const error = new Error('Database connection failed');
                cycleRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
            });
            it('should throw error if user repository fails during employee lookup', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const error = new Error('User service unavailable');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('User service unavailable');
            });
            it('should propagate peer feedback repository errors', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const error = new Error('Peer feedback query failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Peer feedback query failed');
            });
            it('should propagate manager evaluation repository errors', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const employee = createValidUser({ id: input.employeeId, managerId: input.managerId.value });
                const manager = createValidUser({ id: input.managerId });
                const error = new Error('Manager evaluation query failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation query failed');
            });
        });
    });
});
//# sourceMappingURL=get-employee-review.use-case.spec.js.map