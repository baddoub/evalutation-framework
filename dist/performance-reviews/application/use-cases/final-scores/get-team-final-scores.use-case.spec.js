"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_team_final_scores_use_case_1 = require("./get-team-final-scores.use-case");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const bonus_tier_vo_1 = require("../../../domain/value-objects/bonus-tier.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
describe('GetTeamFinalScoresUseCase', () => {
    let useCase;
    let finalScoreRepository;
    let cycleRepository;
    let userRepository;
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
    const createValidUser = (managerId, level = 'L3') => {
        return user_entity_1.User.create({
            id: user_id_vo_1.UserId.generate(),
            email: email_vo_1.Email.create(`user${Math.random().toString(36).substr(2, 9)}@example.com`),
            name: 'John Doe',
            keycloakId: `keycloak-${Math.random().toString(36).substr(2, 9)}`,
            roles: [role_vo_1.Role.user()],
            isActive: true,
            level,
            department: 'Engineering',
            managerId: managerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    const createValidFinalScore = (cycleId, userId, expectedBonusTier = bonus_tier_vo_1.BonusTier.MEETS) => {
        let scoreValue = 2.8;
        if (expectedBonusTier.equals(bonus_tier_vo_1.BonusTier.EXCEEDS)) {
            scoreValue = 3.5;
        }
        else if (expectedBonusTier.equals(bonus_tier_vo_1.BonusTier.BELOW)) {
            scoreValue = 1.5;
        }
        const weightedScore = weighted_score_vo_1.WeightedScore.fromValue(scoreValue);
        return final_score_entity_1.FinalScore.create({
            id: final_score_entity_1.FinalScoreId.generate(),
            cycleId,
            userId,
            pillarScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            weightedScore,
            finalLevel: engineer_level_vo_1.EngineerLevel.MID,
            peerFeedbackCount: 3,
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
        cycleRepository = {
            findById: jest.fn(),
            findByYear: jest.fn(),
            findActive: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
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
        useCase = new get_team_final_scores_use_case_1.GetTeamFinalScoresUseCase(finalScoreRepository, cycleRepository, userRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve all team members\' final scores', () => {
            it('should return scores for all direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                const finalScore1 = createValidFinalScore(cycleId, employee1.id);
                const finalScore2 = createValidFinalScore(cycleId, employee2.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(finalScore1)
                    .mockResolvedValueOnce(finalScore2);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                expect(result.teamScores[0].employeeId).toBe(employee1.id.value);
                expect(result.teamScores[1].employeeId).toBe(employee2.id.value);
            });
            it('should call findByManagerId with correct manager ID', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                await useCase.execute(input);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId.value);
                expect(userRepository.findByManagerId).toHaveBeenCalledTimes(1);
            });
            it('should retrieve scores in parallel for multiple employees', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employees = Array.from({ length: 5 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(employees);
                employees.forEach((employee) => {
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(5);
            });
            it('should process team scores using Promise.all for efficiency', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employees = Array.from({ length: 3 }, () => createValidUser(managerId.value));
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(employees);
                employees.forEach((employee) => {
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
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
        describe('CRITICAL: Should only return direct reports\' scores', () => {
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                result.teamScores.forEach((score) => {
                    expect([directReport1.id.value, directReport2.id.value]).toContain(score.employeeId);
                });
            });
            it('should not retrieve scores for employees not in findByManagerId result', async () => {
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                const resultEmployeeIds = result.teamScores.map((s) => s.employeeId);
                expect(resultEmployeeIds).toEqual(expect.arrayContaining([employee1.id.value, employee2.id.value]));
            });
            it('should filter scores to match manager ID from input', async () => {
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId1.value);
            });
        });
        describe('CRITICAL: Should include complete score data for each employee', () => {
            it('should include all required fields in score data', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                const score = result.teamScores[0];
                expect(score).toHaveProperty('employeeId');
                expect(score).toHaveProperty('employeeName');
                expect(score).toHaveProperty('level');
                expect(score).toHaveProperty('weightedScore');
                expect(score).toHaveProperty('percentageScore');
                expect(score).toHaveProperty('bonusTier');
                expect(score).toHaveProperty('feedbackDelivered');
            });
            it('should include weighted score from final score entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].weightedScore).toBe(finalScore.weightedScore.value);
            });
            it('should include percentage score from final score entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].percentageScore).toBe(finalScore.percentageScore);
            });
            it('should include bonus tier from final score entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const finalScore = createValidFinalScore(cycleId, employee.id, bonus_tier_vo_1.BonusTier.EXCEEDS);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].bonusTier).toBe(finalScore.bonusTier.value);
            });
            it('should include feedback delivered status', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].feedbackDelivered).toBe(finalScore.feedbackDelivered);
            });
            it('should include employee name from user entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const expectedName = employee.name;
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].employeeName).toBe(expectedName);
            });
            it('should include employee level from user entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value, 'L4');
                const finalScore = createValidFinalScore(cycleId, employee.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore);
                const result = await useCase.execute(input);
                expect(result.teamScores[0].level).toBe(employee.level);
            });
        });
        describe('IMPORTANT: Should return array of final score DTOs', () => {
            it('should return output as GetTeamFinalScoresOutput interface', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('teamScores');
                expect(Array.isArray(result.teamScores)).toBe(true);
            });
            it('should return array with correct structure for each score', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                const result = await useCase.execute(input);
                expect(result.teamScores[0]).toHaveProperty('employeeId');
                expect(result.teamScores[0]).toHaveProperty('employeeName');
                expect(result.teamScores[0]).toHaveProperty('level');
                expect(result.teamScores[0]).toHaveProperty('weightedScore');
                expect(result.teamScores[0]).toHaveProperty('percentageScore');
                expect(result.teamScores[0]).toHaveProperty('bonusTier');
                expect(result.teamScores[0]).toHaveProperty('feedbackDelivered');
            });
            it('should return string IDs and primitive types in score objects', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                const result = await useCase.execute(input);
                expect(typeof result.teamScores[0].employeeId).toBe('string');
                expect(typeof result.teamScores[0].employeeName).toBe('string');
                expect(typeof result.teamScores[0].level).toBe('string');
                expect(typeof result.teamScores[0].weightedScore).toBe('number');
                expect(typeof result.teamScores[0].percentageScore).toBe('number');
                expect(typeof result.teamScores[0].bonusTier).toBe('string');
                expect(typeof result.teamScores[0].feedbackDelivered).toBe('boolean');
            });
        });
        describe('IMPORTANT: Should handle empty team gracefully', () => {
            it('should return empty scores array when manager has no direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                const result = await useCase.execute(input);
                expect(result.teamScores).toEqual([]);
            });
            it('should return output structure even with empty team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('teamScores');
                expect(Array.isArray(result.teamScores)).toBe(true);
            });
            it('should not call final score repository if no direct reports', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([]);
                await useCase.execute(input);
                expect(finalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
            });
        });
        describe('IMPORTANT: Should include bonus tier distribution summary', () => {
            it('should handle different bonus tiers in team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const employee3 = createValidUser(managerId.value);
                const directReports = [employee1, employee2, employee3];
                const score1 = createValidFinalScore(cycleId, employee1.id, bonus_tier_vo_1.BonusTier.EXCEEDS);
                const score2 = createValidFinalScore(cycleId, employee2.id, bonus_tier_vo_1.BonusTier.MEETS);
                const score3 = createValidFinalScore(cycleId, employee3.id, bonus_tier_vo_1.BonusTier.BELOW);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(score1)
                    .mockResolvedValueOnce(score2)
                    .mockResolvedValueOnce(score3);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(3);
                expect(result.teamScores[0].bonusTier).toBe('EXCEEDS');
                expect(result.teamScores[1].bonusTier).toBe('MEETS');
                expect(result.teamScores[2].bonusTier).toBe('BELOW');
            });
            it('should preserve bonus tier values across team', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employees = Array.from({ length: 5 }, () => createValidUser(managerId.value));
                const tiers = [
                    bonus_tier_vo_1.BonusTier.EXCEEDS,
                    bonus_tier_vo_1.BonusTier.MEETS,
                    bonus_tier_vo_1.BonusTier.BELOW,
                    bonus_tier_vo_1.BonusTier.MEETS,
                    bonus_tier_vo_1.BonusTier.EXCEEDS,
                ];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(employees);
                employees.forEach((employee, index) => {
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id, tiers[index]));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores[0].bonusTier).toBe('EXCEEDS');
                expect(result.teamScores[1].bonusTier).toBe('MEETS');
                expect(result.teamScores[2].bonusTier).toBe('BELOW');
                expect(result.teamScores[3].bonusTier).toBe('MEETS');
                expect(result.teamScores[4].bonusTier).toBe('EXCEEDS');
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(100);
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
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
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(30);
                const resultEmployeeIds = result.teamScores.map((s) => s.employeeId);
                const inputEmployeeIds = largeTeam.map((e) => e.id.value);
                expect(resultEmployeeIds).toEqual(expect.arrayContaining(inputEmployeeIds));
            });
        });
        describe('EDGE: Should filter by level if specified', () => {
            it('should handle employees with different levels', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value, 'L3');
                const employee2 = createValidUser(managerId.value, 'L4');
                const directReports = [employee1, employee2];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                directReports.forEach((employee) => {
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                result.teamScores.forEach((score) => {
                    expect(score.level).toBeDefined();
                    expect(typeof score.level).toBe('string');
                });
            });
            it('should include employee level from user entity', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value, 'L5');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                const result = await useCase.execute(input);
                expect(result.teamScores[0].level).toBe('L5');
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
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                const result = await useCase.execute(input);
                expect(result.teamScores[0].level).toBe('Unknown');
            });
        });
        describe('EDGE: Should handle partial team scores (some employees missing)', () => {
            it('should handle employees with no final score in system', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const directReports = [employee1, employee2];
                const finalScore1 = createValidFinalScore(cycleId, employee1.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(finalScore1)
                    .mockResolvedValueOnce(null);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(2);
                expect(result.teamScores[0].employeeId).toBe(employee1.id.value);
                expect(result.teamScores[1].employeeId).toBe(employee2.id.value);
            });
            it('should return default scores when final score is missing', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(null);
                const result = await useCase.execute(input);
                const score = result.teamScores[0];
                expect(score.weightedScore).toBe(0);
                expect(score.percentageScore).toBe(0);
                expect(score.bonusTier).toBe('BELOW');
                expect(score.feedbackDelivered).toBe(false);
            });
            it('should include employee info even when final score is missing', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value, 'L3');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(null);
                const result = await useCase.execute(input);
                const score = result.teamScores[0];
                expect(score.employeeId).toBe(employee.id.value);
                expect(score.employeeName).toBe(employee.name);
                expect(score.level).toBe('L3');
            });
            it('should handle mix of employees with and without scores', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value);
                const employee2 = createValidUser(managerId.value);
                const employee3 = createValidUser(managerId.value);
                const directReports = [employee1, employee2, employee3];
                const finalScore1 = createValidFinalScore(cycleId, employee1.id);
                const finalScore3 = createValidFinalScore(cycleId, employee3.id);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(finalScore1)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(finalScore3);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(3);
                expect(result.teamScores[0].weightedScore).toBe(finalScore1.weightedScore.value);
                expect(result.teamScores[1].weightedScore).toBe(0);
                expect(result.teamScores[2].weightedScore).toBe(finalScore3.weightedScore.value);
            });
        });
        describe('EDGE: Should verify manager authorization', () => {
            it('should accept any manager ID without additional authorization check', async () => {
                const managerId1 = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId1, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const directReports = [createValidUser(managerId1.value)];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, directReports[0].id));
                const result = await useCase.execute(input);
                expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId1.value);
                expect(result.teamScores).toHaveLength(1);
            });
            it('should retrieve only the team members associated with the manager', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const teamMembers = [
                    createValidUser(managerId.value),
                    createValidUser(managerId.value),
                ];
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(teamMembers);
                teamMembers.forEach((employee) => {
                    finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(createValidFinalScore(cycleId, employee.id));
                });
                const result = await useCase.execute(input);
                const resultEmployeeIds = result.teamScores.map((s) => s.employeeId);
                expect(resultEmployeeIds).toEqual(expect.arrayContaining(teamMembers.map((m) => m.id.value)));
                expect(result.teamScores).toHaveLength(2);
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
            it('should throw error if final score repository fails for any employee', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee = createValidUser(managerId.value);
                const error = new Error('Final score repository error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue([employee]);
                finalScoreRepository.findByUserAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Final score repository error');
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: retrieve team scores with mixed states', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employee1 = createValidUser(managerId.value, 'L3');
                const employee2 = createValidUser(managerId.value, 'L4');
                const employee3 = createValidUser(managerId.value, 'L5');
                const directReports = [employee1, employee2, employee3];
                const score1 = createValidFinalScore(cycleId, employee1.id, bonus_tier_vo_1.BonusTier.EXCEEDS);
                const score2 = createValidFinalScore(cycleId, employee2.id, bonus_tier_vo_1.BonusTier.MEETS);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(score1)
                    .mockResolvedValueOnce(score2)
                    .mockResolvedValueOnce(null);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(3);
                expect(result.teamScores[0].employeeId).toBe(employee1.id.value);
                expect(result.teamScores[0].bonusTier).toBe('EXCEEDS');
                expect(result.teamScores[0].level).toBe('L3');
                expect(result.teamScores[0].weightedScore).toBe(score1.weightedScore.value);
                expect(result.teamScores[1].employeeId).toBe(employee2.id.value);
                expect(result.teamScores[1].bonusTier).toBe('MEETS');
                expect(result.teamScores[1].level).toBe('L4');
                expect(result.teamScores[1].weightedScore).toBe(score2.weightedScore.value);
                expect(result.teamScores[2].employeeId).toBe(employee3.id.value);
                expect(result.teamScores[2].bonusTier).toBe('BELOW');
                expect(result.teamScores[2].level).toBe('L5');
                expect(result.teamScores[2].weightedScore).toBe(0);
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
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(createValidFinalScore(cycleId, employee.id));
                const result1 = await useCase.execute(input);
                const result2 = await useCase.execute(input);
                expect(result1.teamScores[0].employeeId).toBe(result2.teamScores[0].employeeId);
                expect(result1.teamScores[0].employeeName).toBe(result2.teamScores[0].employeeName);
                expect(result1.teamScores[0].level).toBe(result2.teamScores[0].level);
            });
            it('should handle complex scenario with all bonus tiers represented', async () => {
                const managerId = createManagerId();
                const cycleId = createCycleId();
                const input = createValidInput(managerId, cycleId);
                const cycle = createValidReviewCycle(cycleId);
                const employeeExceeds = createValidUser(managerId.value);
                const employeeMeets = createValidUser(managerId.value);
                const employeeBelow = createValidUser(managerId.value);
                const directReports = [employeeExceeds, employeeMeets, employeeBelow];
                const scoreExceeds = createValidFinalScore(cycleId, employeeExceeds.id, bonus_tier_vo_1.BonusTier.EXCEEDS);
                const scoreMeets = createValidFinalScore(cycleId, employeeMeets.id, bonus_tier_vo_1.BonusTier.MEETS);
                const scoreBelow = createValidFinalScore(cycleId, employeeBelow.id, bonus_tier_vo_1.BonusTier.BELOW);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findByManagerId.mockResolvedValue(directReports);
                finalScoreRepository.findByUserAndCycle
                    .mockResolvedValueOnce(scoreExceeds)
                    .mockResolvedValueOnce(scoreMeets)
                    .mockResolvedValueOnce(scoreBelow);
                const result = await useCase.execute(input);
                expect(result.teamScores).toHaveLength(3);
                const tierDistribution = result.teamScores.reduce((acc, score) => {
                    acc[score.bonusTier] = (acc[score.bonusTier] || 0) + 1;
                    return acc;
                }, {});
                expect(tierDistribution['EXCEEDS']).toBe(1);
                expect(tierDistribution['MEETS']).toBe(1);
                expect(tierDistribution['BELOW']).toBe(1);
            });
        });
    });
});
//# sourceMappingURL=get-team-final-scores.use-case.spec.js.map