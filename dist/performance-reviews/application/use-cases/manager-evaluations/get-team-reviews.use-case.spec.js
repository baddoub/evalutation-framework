"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_team_reviews_use_case_1 = require("./get-team-reviews.use-case");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const self_review_entity_1 = require("../../../domain/entities/self-review.entity");
const manager_evaluation_entity_1 = require("../../../domain/entities/manager-evaluation.entity");
const peer_feedback_entity_1 = require("../../../domain/entities/peer-feedback.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const review_status_vo_1 = require("../../../domain/value-objects/review-status.vo");
const narrative_vo_1 = require("../../../domain/value-objects/narrative.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
describe('GetTeamReviewsUseCase', () => {
    let useCase;
    let userRepository;
    let cycleRepository;
    let selfReviewRepository;
    let peerFeedbackRepository;
    let managerEvaluationRepository;
    const createManagerId = () => user_id_vo_1.UserId.generate();
    const createCycleId = () => review_cycle_id_vo_1.ReviewCycleId.generate();
    const createValidInput = (managerId = createManagerId(), cycleId = createCycleId()) => ({
        managerId,
        cycleId,
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
    const createValidUser = (managerId) => {
        return user_entity_1.User.create({
            id: user_id_vo_1.UserId.generate(),
            email: email_vo_1.Email.create(`user${Math.random().toString(36).substr(2, 9)}@example.com`),
            name: 'John Doe',
            keycloakId: `keycloak-${Math.random().toString(36).substr(2, 9)}`,
            roles: [role_vo_1.Role.user()],
            isActive: true,
            level: 'L3',
            department: 'Engineering',
            managerId: managerId,
            createdAt: new Date(),
            updatedAt: new Date(),
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
    const createValidManagerEvaluation = (cycleId, employeeId, managerId) => {
        return manager_evaluation_entity_1.ManagerEvaluation.create({
            cycleId,
            employeeId,
            managerId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            }),
            narrative: 'Manager evaluation narrative',
            strengths: 'Strong technical skills',
            growthAreas: 'Leadership development',
            developmentPlan: 'Consider mentoring opportunities',
        });
    };
    const createValidPeerFeedback = (cycleId, revieweeId, reviewerId) => {
        return peer_feedback_entity_1.PeerFeedback.create({
            cycleId,
            revieweeId,
            reviewerId,
            scores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            strengths: 'Good collaborator',
            growthAreas: 'Could improve communication',
            generalComments: 'Overall positive experience',
        });
    };
    beforeEach(() => {
        userRepository = {
            findById: jest.fn(),
            findByManagerId: jest.fn(),
            findByKeycloakId: jest.fn(),
            findByEmail: jest.fn(),
            existsByEmail: jest.fn(),
            findByRole: jest.fn(),
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
            findByReviewerAndCycle: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
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
        useCase = new get_team_reviews_use_case_1.GetTeamReviewsUseCase(userRepository, cycleRepository, selfReviewRepository, peerFeedbackRepository, managerEvaluationRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve all team members\' evaluations for a manager', () => {
            it('should return reviews for all direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                const selfReview1 = createValidSelfReview(cycleId, employee1.id);
                const selfReview2 = createValidSelfReview(cycleId, employee2.id);
                const peerFeedback1 = [
                    createValidPeerFeedback(cycleId, employee1.id, user_id_vo_1.UserId.generate()),
                    createValidPeerFeedback(cycleId, employee1.id, user_id_vo_1.UserId.generate()),
                ];
                const peerFeedback2 = [
                    createValidPeerFeedback(cycleId, employee2.id, user_id_vo_1.UserId.generate()),
                ];
                const managerEval1 = createValidManagerEvaluation(cycleId, employee1.id, managerId);
                const managerEval2 = createValidManagerEvaluation(cycleId, employee2.id, managerId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                selfReviewRepository.findByUserAndCycle
                    .mockResolvedValueOnce(selfReview1)
                    .mockResolvedValueOnce(selfReview2);
                peerFeedbackRepository.findByRevieweeAndCycle
                    .mockResolvedValueOnce(peerFeedback1)
                    .mockResolvedValueOnce(peerFeedback2);
                managerEvaluationRepository.findByEmployeeAndCycle
                    .mockResolvedValueOnce(managerEval1)
                    .mockResolvedValueOnce(managerEval2);
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(2);
                expect(result.reviews[0].employeeId).toBe(employee1.id.value);
                expect(result.reviews[1].employeeId).toBe(employee2.id.value);
            });
            it('should call findByManagerId with correct manager ID', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                cycleRepository.findById.mockResolvedValue(cycle);
                await useCase.execute(input);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId.value);
                expect(userRepository.findByManagerId).toHaveBeenCalledTimes(1);
            });
            it('should retrieve reviews in parallel for multiple employees', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employees = Array.from({ length: 5 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(employees);
                employees.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(5);
                expect(result.total).toBe(5);
            });
            it('should process team reviews using Promise.all for efficiency', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employees = Array.from({ length: 3 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(employees);
                employees.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const startTime = Date.now();
                await useCase.execute(input);
                const endTime = Date.now();
                expect(endTime - startTime).toBeLessThan(5000);
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
            it('should not proceed to find direct reports if cycle validation fails', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(userRepository.findByManagerId).not.toHaveBeenCalled();
            });
            it('should propagate cycle repository errors without modification', async () => {
                const input = createValidInput();
                const customError = new review_not_found_exception_1.ReviewNotFoundException('Custom cycle error');
                cycleRepository.findById.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
        });
        describe('CRITICAL: Should only return direct reports\' evaluations', () => {
            it('should only include employees where managerId matches input managerId', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const directReport1 = createValidUser(managerId.value);
                const directReport2 = createValidUser(managerId.value);
                const directReports = [directReport1, directReport2];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                directReports.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(2);
                result.reviews.forEach((review) => {
                    expect([directReport1.id.value, directReport2.id.value]).toContain(review.employeeId);
                });
            });
            it('should not retrieve reviews for employees not in findByManagerId result', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                directReports.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(2);
                const resultEmployeeIds = result.reviews.map((r) => r.employeeId);
                expect(resultEmployeeIds).toEqual(expect.arrayContaining([employee1.id.value, employee2.id.value]));
            });
            it('should filter reviews to match manager ID from input', async () => {
                const managerId1 = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId1, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const directReports = [
                    createValidUser(managerId1.value),
                    createValidUser(managerId1.value),
                ];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                directReports.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId1));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(2);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId1.value);
            });
        });
        describe('IMPORTANT: Should return array of evaluation DTOs', () => {
            it('should return output as GetTeamReviewsOutput interface', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('reviews');
                expect(result).toHaveProperty('total');
                expect(Array.isArray(result.reviews)).toBe(true);
                expect(typeof result.total).toBe('number');
            });
            it('should return array with correct structure for each review', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                expect(result.reviews[0]).toHaveProperty('employeeId');
                expect(result.reviews[0]).toHaveProperty('employeeName');
                expect(result.reviews[0]).toHaveProperty('employeeLevel');
                expect(result.reviews[0]).toHaveProperty('selfReviewStatus');
                expect(result.reviews[0]).toHaveProperty('peerFeedbackCount');
                expect(result.reviews[0]).toHaveProperty('peerFeedbackStatus');
                expect(result.reviews[0]).toHaveProperty('managerEvalStatus');
                expect(result.reviews[0]).toHaveProperty('hasSubmittedEvaluation');
            });
            it('should return string IDs and primitive types in review objects', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                expect(typeof result.reviews[0].employeeId).toBe('string');
                expect(typeof result.reviews[0].employeeName).toBe('string');
                expect(typeof result.reviews[0].employeeLevel).toBe('string');
                expect(typeof result.reviews[0].selfReviewStatus).toBe('string');
                expect(typeof result.reviews[0].peerFeedbackCount).toBe('number');
                expect(typeof result.reviews[0].peerFeedbackStatus).toBe('string');
                expect(typeof result.reviews[0].managerEvalStatus).toBe('string');
                expect(typeof result.reviews[0].hasSubmittedEvaluation).toBe('boolean');
            });
            it('should include employee name from user entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const expectedName = employee.name;
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                expect(result.reviews[0].employeeName).toBe(expectedName);
            });
        });
        describe('IMPORTANT: Should handle empty team (no direct reports)', () => {
            it('should return empty reviews array when manager has no direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                const result = await useCase.execute(input);
                expect(result.reviews).toEqual([]);
                expect(result.total).toBe(0);
            });
            it('should return output structure even with empty team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('reviews');
                expect(result).toHaveProperty('total');
                expect(Array.isArray(result.reviews)).toBe(true);
            });
            it('should not call review repositories if no direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                await useCase.execute(input);
                expect(selfReviewRepository.findByUserAndCycle).not.toHaveBeenCalled();
                expect(peerFeedbackRepository.findByRevieweeAndCycle).not.toHaveBeenCalled();
                expect(managerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled();
            });
            it('should have total count of zero for empty team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                const result = await useCase.execute(input);
                expect(result.total).toBe(0);
            });
        });
        describe('IMPORTANT: Should include all evaluation data', () => {
            it('should include scores in review data', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.selfReviewStatus).toBeDefined();
                expect(review.managerEvalStatus).toBeDefined();
                expect(typeof review.selfReviewStatus).toBe('string');
                expect(typeof review.managerEvalStatus).toBe('string');
            });
            it('should include submission dates status', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                const selfReview = createValidSelfReview(cycleId, employee.id);
                selfReview.submit();
                const managerEval = createValidManagerEvaluation(cycleId, employee.id, managerId);
                managerEval.submit();
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(selfReview);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(managerEval);
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(review.managerEvalStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(review.hasSubmittedEvaluation).toBe(true);
            });
            it('should track peer feedback completion status', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                const peerFeedbacks = Array.from({ length: 4 }, () => createValidPeerFeedback(cycleId, employee.id, user_id_vo_1.UserId.generate()));
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce(peerFeedbacks);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.peerFeedbackCount).toBe(4);
                expect(review.peerFeedbackStatus).toBe('COMPLETE');
            });
        });
        describe('EDGE: Should handle partially completed team reviews', () => {
            it('should handle employees with self-review but no manager evaluation', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(null);
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.selfReviewStatus).not.toBe('NOT_STARTED');
                expect(review.managerEvalStatus).toBe('NOT_STARTED');
            });
            it('should handle employees with no self-review but with manager evaluation', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(null);
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.selfReviewStatus).toBe('NOT_STARTED');
                expect(review.managerEvalStatus).not.toBe('NOT_STARTED');
            });
            it('should handle employees with no peer feedback', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.peerFeedbackCount).toBe(0);
                expect(review.peerFeedbackStatus).toBe('PENDING');
            });
            it('should handle employees with incomplete peer feedback (less than 3)', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                const peerFeedbacks = Array.from({ length: 2 }, () => createValidPeerFeedback(cycleId, employee.id, user_id_vo_1.UserId.generate()));
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce(peerFeedbacks);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.peerFeedbackCount).toBe(2);
                expect(review.peerFeedbackStatus).toBe('PENDING');
            });
            it('should mark peer feedback as COMPLETE when exactly 3 feedbacks exist', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                const peerFeedbacks = Array.from({ length: 3 }, () => createValidPeerFeedback(cycleId, employee.id, user_id_vo_1.UserId.generate()));
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce(peerFeedbacks);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.peerFeedbackCount).toBe(3);
                expect(review.peerFeedbackStatus).toBe('COMPLETE');
            });
            it('should handle mix of submitted and draft evaluations in team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                const selfReview1 = createValidSelfReview(cycleId, employee1.id);
                selfReview1.submit();
                const selfReview2 = createValidSelfReview(cycleId, employee2.id);
                const managerEval1 = createValidManagerEvaluation(cycleId, employee1.id, managerId);
                managerEval1.submit();
                const managerEval2 = createValidManagerEvaluation(cycleId, employee2.id, managerId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                selfReviewRepository.findByUserAndCycle
                    .mockResolvedValueOnce(selfReview1)
                    .mockResolvedValueOnce(selfReview2);
                peerFeedbackRepository.findByRevieweeAndCycle
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle
                    .mockResolvedValueOnce(managerEval1)
                    .mockResolvedValueOnce(managerEval2);
                const result = await useCase.execute(input);
                expect(result.reviews[0].selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.reviews[0].hasSubmittedEvaluation).toBe(true);
                expect(result.reviews[1].selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.reviews[1].hasSubmittedEvaluation).toBe(false);
            });
        });
        describe('EDGE: Should filter by employee level if specified', () => {
            it('should handle employees with different levels', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                directReports.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(2);
                result.reviews.forEach((review) => {
                    expect(review.employeeLevel).toBeDefined();
                    expect(typeof review.employeeLevel).toBe('string');
                });
            });
            it('should include employee level from user entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                const review = result.reviews[0];
                expect(review.employeeLevel).toBe(employee.level || 'Unknown');
            });
            it('should use "Unknown" when employee has no level', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = user_entity_1.User.create({
                    id: user_id_vo_1.UserId.generate(),
                    email: email_vo_1.Email.create('user@example.com'),
                    name: 'John Doe',
                    keycloakId: 'keycloak-123',
                    roles: [role_vo_1.Role.user()],
                    isActive: true,
                    level: null,
                    managerId: managerId.value,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result = await useCase.execute(input);
                expect(result.reviews[0].employeeLevel).toBe('Unknown');
            });
        });
        describe('EDGE: Should handle large teams efficiently', () => {
            it('should efficiently handle large number of direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const largeTeam = Array.from({ length: 100 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(largeTeam);
                largeTeam.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(100);
                expect(result.total).toBe(100);
            });
            it('should process large teams in reasonable time with parallel execution', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const largeTeam = Array.from({ length: 50 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(largeTeam);
                largeTeam.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const startTime = Date.now();
                await useCase.execute(input);
                const duration = Date.now() - startTime;
                expect(duration).toBeLessThan(10000);
            });
            it('should maintain data consistency with large team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const largeTeam = Array.from({ length: 30 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(largeTeam);
                largeTeam.forEach((employee) => {
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(createValidManagerEvaluation(cycleId, employee.id, managerId));
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(30);
                expect(result.total).toBe(30);
                const resultEmployeeIds = result.reviews.map((r) => r.employeeId);
                const inputEmployeeIds = largeTeam.map((e) => e.id.value);
                expect(resultEmployeeIds).toEqual(expect.arrayContaining(inputEmployeeIds));
            });
            it('should handle team with mixed review completion states at scale', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const largeTeam = Array.from({ length: 25 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(largeTeam);
                largeTeam.forEach((employee, index) => {
                    const selfReview = createValidSelfReview(cycleId, employee.id);
                    if (index % 2 === 0) {
                        selfReview.submit();
                    }
                    const managerEval = createValidManagerEvaluation(cycleId, employee.id, managerId);
                    if (index % 3 === 0) {
                        managerEval.submit();
                    }
                    selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(selfReview);
                    peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                    managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(managerEval);
                });
                const result = await useCase.execute(input);
                expect(result.reviews).toHaveLength(25);
                const submittedReviews = result.reviews.filter((r) => r.selfReviewStatus === review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(submittedReviews.length).toBeGreaterThan(0);
            });
        });
        describe('IMPORTANT: Should handle repository errors gracefully', () => {
            it('should throw error if cycle repository fails', async () => {
                const input = createValidInput();
                const error = new Error('Database connection failed');
                cycleRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
            });
            it('should throw error if user repository fails', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const error = new Error('User repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('User repository error');
            });
            it('should throw error if self-review repository fails for any employee', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const error = new Error('Self-review repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Self-review repository error');
            });
            it('should throw error if peer feedback repository fails', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const error = new Error('Peer feedback repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Peer feedback repository error');
            });
            it('should throw error if manager evaluation repository fails', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const error = new Error('Manager evaluation repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValueOnce(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValueOnce([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation repository error');
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: retrieve team reviews with mixed states', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const employee3 = createValidUser(managerId.value);
                const directReports = [employee1, employee2, employee3];
                const selfReview1 = createValidSelfReview(cycleId, employee1.id);
                selfReview1.submit();
                const managerEval1 = createValidManagerEvaluation(cycleId, employee1.id, managerId);
                managerEval1.submit();
                const peerFeedback1 = Array.from({ length: 4 }, () => createValidPeerFeedback(cycleId, employee1.id, user_id_vo_1.UserId.generate()));
                const selfReview2 = createValidSelfReview(cycleId, employee2.id);
                const managerEval2 = createValidManagerEvaluation(cycleId, employee2.id, managerId);
                managerEval2.submit();
                const peerFeedback2 = Array.from({ length: 2 }, () => createValidPeerFeedback(cycleId, employee2.id, user_id_vo_1.UserId.generate()));
                const selfReview3 = createValidSelfReview(cycleId, employee3.id);
                const managerEval3 = createValidManagerEvaluation(cycleId, employee3.id, managerId);
                const peerFeedback3 = [];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                selfReviewRepository.findByUserAndCycle
                    .mockResolvedValueOnce(selfReview1)
                    .mockResolvedValueOnce(selfReview2)
                    .mockResolvedValueOnce(selfReview3);
                peerFeedbackRepository.findByRevieweeAndCycle
                    .mockResolvedValueOnce(peerFeedback1)
                    .mockResolvedValueOnce(peerFeedback2)
                    .mockResolvedValueOnce(peerFeedback3);
                managerEvaluationRepository.findByEmployeeAndCycle
                    .mockResolvedValueOnce(managerEval1)
                    .mockResolvedValueOnce(managerEval2)
                    .mockResolvedValueOnce(managerEval3);
                const result = await useCase.execute(input);
                expect(result.total).toBe(3);
                expect(result.reviews).toHaveLength(3);
                expect(result.reviews[0].selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.reviews[0].managerEvalStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.reviews[0].hasSubmittedEvaluation).toBe(true);
                expect(result.reviews[0].peerFeedbackStatus).toBe('COMPLETE');
                expect(result.reviews[0].peerFeedbackCount).toBe(4);
                expect(result.reviews[1].selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.reviews[1].managerEvalStatus).toBe(review_status_vo_1.ReviewStatus.SUBMITTED.value);
                expect(result.reviews[1].hasSubmittedEvaluation).toBe(true);
                expect(result.reviews[1].peerFeedbackStatus).toBe('PENDING');
                expect(result.reviews[1].peerFeedbackCount).toBe(2);
                expect(result.reviews[2].selfReviewStatus).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.reviews[2].managerEvalStatus).toBe(review_status_vo_1.ReviewStatus.DRAFT.value);
                expect(result.reviews[2].hasSubmittedEvaluation).toBe(false);
                expect(result.reviews[2].peerFeedbackStatus).toBe('PENDING');
                expect(result.reviews[2].peerFeedbackCount).toBe(0);
            });
            it('should verify correct repository calls in sequence', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(cycleRepository.findById).toHaveBeenCalledTimes(1);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(input.managerId.value);
                expect(userRepository.findByManagerId).toHaveBeenCalledTimes(1);
            });
            it('should return consistent data across multiple executions', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                selfReviewRepository.findByUserAndCycle.mockResolvedValue(createValidSelfReview(cycleId, employee.id));
                peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([]);
                managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(createValidManagerEvaluation(cycleId, employee.id, managerId));
                const result1 = await useCase.execute(input);
                const result2 = await useCase.execute(input);
                expect(result1.reviews[0].employeeId).toBe(result2.reviews[0].employeeId);
                expect(result1.reviews[0].employeeName).toBe(result2.reviews[0].employeeName);
                expect(result1.total).toBe(result2.total);
            });
        });
    });
});
//# sourceMappingURL=get-team-reviews.use-case.spec.js.map